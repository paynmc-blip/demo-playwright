#!/usr/bin/env node
import { readFile, mkdir, writeFile, access, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const REPORT_DIR = "playwright-report";
// Archivo propio del pipeline: `test-results.json` lo reescribe cualquier invocación de
// Playwright, incluidas las pasadas de descubrimiento del plugin del IDE, que lo dejan
// con los tests en "skipped". Con --run-tests escribimos aquí vía PLAYWRIGHT_JSON_OUTPUT_NAME.
const INPUT_JSON = "test-results-ai.json";
const FALLBACK_JSON = "test-results.json";
const MODEL = "claude-haiku-4-5-20251001";

function log(msg)     { console.log(`👉 ${msg}`); }
function success(msg) { console.log(`✅ ${msg}`); }
function errorLog(msg){ console.error(`❌ ${msg}`); }

async function main() {
    log("Iniciando AI Reporting Pipeline...");
    await mkdir(REPORT_DIR, { recursive: true });

    // Con --run-tests corremos la suite aquí, ignorando su código de salida: los fallos
    // son justamente lo que hay que analizar, así que no pueden abortar el pipeline.
    if (process.argv.includes("--run-tests")) {
        await runTests();
    }

    const { file: inputJson, raw: testResultsRaw, stats } = await pickRun();

    log(`Analizando ${inputJson}${stats.start_time ? ` · corrida del ${new Date(stats.start_time).toLocaleString()}` : ""}`);
    log(`Estadísticas: ${stats.total} total · ${stats.passed} pasaron · ${stats.failed} fallaron · ${stats.skipped} omitidas · ${stats.flaky} flaky`);

    // 1️⃣ Agrupar fallos
    const pGroup = await readFile("prompts/ai-group-failures.txt", "utf8");
    const groupedRaw = await runClaude(pGroup, testResultsRaw, "Agrupación de fallos");
    const groupedClean = stripMarkdownFences(groupedRaw);

    let grouped;
    try {
        grouped = JSON.parse(groupedClean);
    } catch {
        throw new Error(
            "La respuesta de Claude para agrupación de fallos no es JSON válido.\n" +
            "Primeros 500 chars:\n" + groupedClean.slice(0, 500)
        );
    }

    // 2️⃣ Resumen · Correcciones · Tickets — en paralelo
    const [pSummary, pCorrections, pTickets] = await Promise.all([
        readFile("prompts/ai-summary.txt", "utf8"),
        readFile("prompts/ai-corrections.txt", "utf8"),
        readFile("prompts/ai-tickets.txt", "utf8"),
    ]);

    log("Generando resumen, correcciones y tickets en paralelo...");

    const summaryInput = JSON.stringify({ stats, grouped });
    const groupedText  = JSON.stringify(grouped);

    const [summaryTxt, correctionsMd, ticketsRaw] = await Promise.all([
        runClaude(pSummary,     summaryInput, "Resumen ejecutivo"),
        runClaude(pCorrections, groupedText,  "Posibles correcciones"),
        runClaude(pTickets,     groupedText,  "Tickets Jira"),
    ]);

    const ticketsClean = stripMarkdownFences(ticketsRaw);
    try {
        JSON.parse(ticketsClean);
    } catch {
        throw new Error(
            "ai-tickets.json no es JSON válido.\nPrimeros 500 chars:\n" + ticketsClean.slice(0, 500)
        );
    }

    await Promise.all([
        writeOutput(path.join(REPORT_DIR, "ai-summary.txt"),             summaryTxt),
        writeOutput(path.join(REPORT_DIR, "ai-corrections.md"),          correctionsMd),
        writeOutput(path.join(REPORT_DIR, "ai-tickets.json"),            ticketsClean),
        writeOutput(path.join(REPORT_DIR, "ai-failures-grouped.json"),   groupedText),
    ]);

    success("AI Reporting finalizado correctamente 🎉");
}

/**
 * Elige qué corrida analizar entre los JSON candidatos.
 *
 * Se queda con la MÁS RECIENTE que tenga tests ejecutados, no con la primera de la lista:
 * `test-results.json` lo reescribe cualquier invocación de Playwright (incluida la pasada de
 * descubrimiento del plugin del IDE, que lo deja todo en "skipped"), y `test-results-ai.json`
 * puede haber quedado de una corrida parcial anterior. Elegir por nombre lleva a analizar la
 * corrida equivocada sin que nada lo delate.
 */
async function pickRun() {
    const runs = [];

    for (const file of [INPUT_JSON, FALLBACK_JSON]) {
        if (!(await exists(file))) continue;

        const raw = await readFile(file, "utf8");
        let stats;
        try {
            stats = extractStats(JSON.parse(raw));
        } catch {
            log(`${file} no es JSON válido; se ignora`);
            continue;
        }

        runs.push({
            file,
            raw,
            stats,
            executed: stats.passed + stats.failed + stats.flaky,
            when: stats.start_time ? Date.parse(stats.start_time) : 0,
        });
    }

    if (runs.length === 0) {
        throw new Error(
            `No existe ${INPUT_JSON} ni ${FALLBACK_JSON}. Ejecuta npm run test:ai, ` +
            "que corre la suite y genera el JSON antes de analizarlo."
        );
    }

    // Una corrida sin tests ejecutados no es un resultado que analizar: es un problema del
    // arranque. Cubre los dos casos vistos: 0 tests (un --grep o una ruta sin coincidencias,
    // una corrida interrumpida) y todos en "skipped" (la pasada de descubrimiento del IDE).
    // Sin esta guarda el pipeline gasta tres llamadas al modelo describiendo la nada.
    const usable = runs.filter((run) => run.executed > 0);
    if (usable.length === 0) {
        const detalle = runs
            .map((r) => `  · ${r.file}: ${r.stats.total} total, ${r.stats.skipped} omitidos`)
            .join("\n");
        throw new Error(
            "Ningún JSON de resultados registra tests ejecutados:\n" + detalle + "\n" +
            "Causas habituales: un --grep o una ruta que no coincide con nada, una corrida\n" +
            "interrumpida, o una pasada de descubrimiento del plugin de Playwright del IDE que\n" +
            "pisó el archivo. Verifica con `npx playwright test --list` y corre `npm run test:ai`,\n" +
            "que ejecuta la suite y escribe su propio JSON antes de analizarlo."
        );
    }

    usable.sort((a, b) => b.when - a.when);

    const [elegida, ...descartadas] = usable;
    for (const otra of descartadas) {
        log(`Se descarta ${otra.file} por ser más antigua (${otra.stats.total} tests)`);
    }

    return elegida;
}

/** Corre la suite completa y sigue adelante pase lo que pase con el código de salida. */
async function runTests() {
    log("Ejecutando la suite de Playwright...");

    // Si la corrida se interrumpe o no llega a escribir, el JSON anterior quedaría haciéndose
    // pasar por el resultado de esta: mejor no tener archivo que tener uno viejo.
    await rm(INPUT_JSON, { force: true });

    return new Promise((resolve, reject) => {
        const child = spawn("npx", ["playwright", "test"], {
            stdio: "inherit",
            // El reporter json escribe donde diga esta variable, no donde diga el config:
            // así el resultado que analizamos no lo pisa ninguna otra corrida.
            env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: INPUT_JSON },
            shell: process.platform === "win32" // npx es un .cmd en Windows
        });

        child.on("error", (err) => {
            reject(new Error(`No se pudo ejecutar Playwright: ${err.message}`));
        });

        child.on("close", (code) => {
            if (code === 0) success("Suite completada sin fallos");
            else log(`La suite terminó con código ${code}; se analizan los fallos igualmente`);
            resolve();
        });
    });
}

function runClaude(promptText, stdinText, label) {
    log(`Ejecutando IA: ${label}...`);
    const start = Date.now();

    return new Promise((resolve, reject) => {
        const child = spawn("claude", [
            "-p", promptText,
            "--model", MODEL
        ], {
            stdio: ["pipe", "pipe", "pipe"],
            env: process.env
        });

        let out = "";
        let settled = false;

        child.stdout.on("data", (d) => { out += d.toString("utf8"); });
        child.stderr.on("data", (d) => { process.stderr.write(d); });

        // Sin este handler, un fallo de spawn deja la promesa sin resolver
        // y el pipeline se cuelga en silencio.
        child.on("error", (err) => {
            if (settled) return;
            settled = true;
            reject(new Error(`No se pudo ejecutar claude en "${label}": ${err.message}`));
        });

        child.on("close", (code) => {
            if (settled) return;
            settled = true;
            const duration = ((Date.now() - start) / 1000).toFixed(2);
            if (code !== 0) {
                reject(new Error(`Claude salió con código ${code} en: ${label}`));
            } else {
                success(`${label} completado en ${duration}s`);
                resolve(out.trim());
            }
        });

        // Si el hijo muere antes de leer el stdin, el EPIPE llega aquí en vez de
        // tumbar el proceso entero; el error real lo reporta "error" o "close".
        child.stdin.on("error", () => {});
        child.stdin.write(stdinText);
        child.stdin.end();
    });
}

function stripMarkdownFences(s) {
    const t = (s ?? "").trim();
    if (/^```json/i.test(t)) return t.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    if (/^```/.test(t))      return t.replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    return t;
}

async function exists(p) {
    try { await access(p); return true; } catch { return false; }
}

async function writeOutput(filePath, content) {
    await writeFile(filePath, content + "\n", "utf8");
    success(`Generado: ${filePath}`);
}

function extractStats(testResults) {
    if (testResults.stats) {
        const s = testResults.stats;
        const passed  = s.expected   ?? 0;
        const failed  = s.unexpected ?? 0;
        const skipped = s.skipped    ?? 0;
        const flaky   = s.flaky      ?? 0;
        return { total: passed + failed + skipped + flaky, passed, failed, skipped, flaky, duration_ms: s.duration ?? 0, start_time: s.startTime ?? null };
    }

    let passed = 0, failed = 0, skipped = 0, flaky = 0;
    // La jerarquía del reporter JSON es suites[] -> specs[] -> tests[] -> results[];
    // los tests cuelgan de cada spec, nunca de la suite directamente.
    function walk(node) {
        for (const spec of node.specs ?? []) {
            for (const test of spec.tests ?? []) {
                const statuses = (test.results ?? []).map(r => r.status);
                if (statuses.length > 1 && statuses.includes("passed")) flaky++;
                else if (statuses.includes("passed"))                    passed++;
                else if (statuses.some(s => s === "failed" || s === "timedOut")) failed++;
                else if (statuses.includes("skipped"))                   skipped++;
            }
        }
        for (const suite of node.suites ?? []) walk(suite);
    }
    for (const suite of testResults.suites ?? []) walk(suite);
    return { total: passed + failed + skipped + flaky, passed, failed, skipped, flaky, duration_ms: 0, start_time: null };
}

main().catch((e) => {
    errorLog(e.message);
    process.exit(1);
});
