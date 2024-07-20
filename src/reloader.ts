import * as acorn from 'acorn'
import * as estree from 'estree'
import * as estraverse from 'estraverse'
import { MethodInfo } from './decorators'

export async function reloadFile(rawJs: string, methods: MethodInfo[]) {
    const acronOptions: acorn.Options = {
        sourceType: 'module',
        ecmaVersion: 'latest',
        locations: true,
    }
    const ast = acorn.parse(rawJs, acronOptions) as unknown as estree.Program

    const lines: string[] = rawJs.split('\n')

    for (const id of methods) {
        reloadMethod(lines, ast, id)
    }
}

export function reloadMethod(lines: string[], ast: estree.Program, methodInfo: MethodInfo): void {
    const { className, classInstance, methodName } = methodInfo
    const funcRaw = extractRawMethod(lines, ast, className, methodName)

    const func = (0, eval)(funcRaw + `; ${methodName}`)

    classInstance.prototype[methodName] = func
}

function extractRawMethod(lines: string[], ast: estree.Program, className: string, methodName: string): string {
    const clazzDef = getClassNode(ast, className)
    if (clazzDef.init?.type != 'ClassExpression') throw new Error()
    const body = clazzDef.init.body.body

    const functions = body.filter(e => e.type == 'MethodDefinition') as estree.MethodDefinition[]

    const funcDef = functions.find(f => f.key.type == 'Identifier' && f.key.name == methodName)
    if (!funcDef) throw new Error(`Method: ${methodName} not found`)

    const funcRawArr = lines.slice(funcDef.loc!.start.line - 1, funcDef.loc!.end.line)
    funcRawArr[0] = funcRawArr[0].slice(funcDef.loc!.start.column)
    funcRawArr[funcRawArr.length - 1] = funcRawArr[funcRawArr.length - 1].slice(0, funcDef.loc!.end.column)

    const funcRaw = 'function ' + funcRawArr.join('\n')

    return funcRaw
}

function getClassNode(ast: estree.Program, className: string): estree.VariableDeclarator {
    let result: estree.VariableDeclarator | undefined
    estraverse.traverse(ast, {
        enter: function (node): void {
            if (node.type === 'VariableDeclaration' && node.kind == 'var' && node.declarations.length == 1) {
                const dec = node.declarations[0]
                if (dec.init && dec.id.type == 'Identifier' && dec.id.name == className) {
                    result = dec
                    this.break()
                }
            }
        },
    })
    if (!result) throw new Error(`class: ${className} not found`)
    return result
}
