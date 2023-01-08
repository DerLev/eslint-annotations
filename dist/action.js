"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs/promises"));
const path_1 = __importDefault(require("path"));
let failStatus = 0;
const eslintAnnotations = async (inputFile, pwd, config) => {
    const filteredReport = inputFile.map((item) => {
        if (!item.messages.length)
            return false;
        return {
            file: item.filePath.replace(pwd, ''),
            messages: item.messages
        };
    }).filter((item) => item !== false);
    filteredReport.map((item) => {
        if (item == false)
            return;
        item.messages.map((msg) => {
            if (msg.severity == 2) {
                core.error(msg.message, {
                    title: config.prefix + ' ' + msg.ruleId,
                    file: item.file,
                    startLine: msg.line,
                    endLine: msg.endLine
                });
            }
            else {
                core.warning(msg.message, {
                    title: config.prefix + ' ' + msg.ruleId,
                    file: item.file,
                    startLine: msg.line,
                    endLine: msg.endLine
                });
            }
        });
    });
    const highestSeverity = (() => {
        let highest = 0;
        filteredReport.map((item) => {
            if (item == false)
                return;
            item.messages.map((msg) => {
                if (msg.severity >= highest)
                    highest = msg.severity;
            });
        });
        return highest;
    })();
    failStatus = highestSeverity;
};
const typescriptAnnotations = async (inputFile, config) => {
    const fileArray = inputFile.split('\n');
    const tsErrors = fileArray.filter((item) => item.includes(': error TS'));
    const formattedErrors = tsErrors.map((error) => {
        const areas = error.split(': ');
        const location = areas[0].split(/[(,)]+/);
        return {
            file: location[0],
            line: Number(location[1]),
            column: Number(location[2]),
            error: areas[1],
            message: areas[2]
        };
    });
    formattedErrors.map((error) => {
        core.error(error.message, {
            title: config.prefix + ' ' + error.error,
            file: error.file,
            startLine: error.line,
            endLine: error.line
        });
    });
    if (formattedErrors.length)
        failStatus = 2;
};
(async () => {
    const eslintInput = process.env.NODE_ENV === 'development' ?
        'eslint_report.json' :
        core.getInput('eslint-report');
    const typescriptInput = process.env.NODE_ENV === 'development' ?
        'typescript.log' :
        core.getInput('typescript-log');
    const errorOnWarn = core.getInput('error-on-warn') === 'true' ? 1 : 2;
    const eslintPrefix = core.getInput('eslint-annotation-prefix');
    const typescriptPrefix = core.getInput('typescript-annotation-prefix');
    const GITHUB_WORKSPACE = !process.env.GITHUB_WORKSPACE ?
        '/home/runner/work/eslint-annotations/eslint-annotations' :
        process.env.GITHUB_WORKSPACE;
    const pwd = GITHUB_WORKSPACE.substring(GITHUB_WORKSPACE.length - 1, GITHUB_WORKSPACE.length) === '/' ?
        GITHUB_WORKSPACE :
        GITHUB_WORKSPACE + '/';
    try {
        if (eslintInput) {
            core.startGroup('ESLint Annotations');
            const eslintFile = await JSON.parse(await (await fs.readFile(path_1.default.join('./', eslintInput))).toString());
            await eslintAnnotations(eslintFile, pwd, { prefix: eslintPrefix });
            core.endGroup();
        }
        if (typescriptInput) {
            core.startGroup('Typescript Annotations');
            const typescriptFile = await (await fs.readFile(path_1.default.join('./', typescriptInput))).toString();
            await typescriptAnnotations(typescriptFile, { prefix: typescriptPrefix });
            core.endGroup();
        }
        if (failStatus >= errorOnWarn) {
            console.log('threshold passed');
            process.exit(1);
        }
    }
    catch (err) {
        core.error(String(err), { title: 'Error reading file' });
        process.exit(1);
    }
})();
