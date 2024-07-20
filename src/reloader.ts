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

    for (let i = methods.length - 1; i >= 0; i--) {
        const id = methods[i]
        if (!reloadMethod(lines, ast, id)) {
            console.warn(`Method: ${id.className}#${id.methodName} has been deleted. Removing from hot-reload list...`)
            methods.splice(i, 1)
        }
    }
}

export function reloadMethod(lines: string[], ast: estree.Program, methodInfo: MethodInfo): boolean {
    const { className, classInstance, methodName } = methodInfo
    const funcRaw = extractRawMethod(lines, ast, className, methodName)
    if (!funcRaw) return false

    const func = (0, eval)(funcRaw + `; ${methodName}`)

    classInstance.prototype[methodName] = func

    return true
}

function extractRawMethod(lines: string[], ast: estree.Program, className: string, methodName: string): string | undefined {
    const clazzDef = getClassBody(ast, className)

    const body = clazzDef?.body.body
    if (!body) return

    const functions = body.filter(e => e.type == 'MethodDefinition') as estree.MethodDefinition[]

    const funcDef = functions.find(f => f.key.type == 'Identifier' && f.key.name == methodName)
    if (!funcDef) return

    const funcRawArr = lines.slice(funcDef.loc!.start.line - 1, funcDef.loc!.end.line)
    funcRawArr[0] = funcRawArr[0].slice(funcDef.loc!.start.column)
    funcRawArr[funcRawArr.length - 1] = funcRawArr[funcRawArr.length - 1].slice(0, funcDef.loc!.end.column)

    const funcRaw = 'function ' + funcRawArr.join('\n')

    return funcRaw
}

function getClassBody(ast: estree.Program, className: string): estree.ClassExpression | undefined {
    let result: estree.ClassExpression | undefined
    estraverse.traverse(ast, {
        enter: function (node): void {
            // var ExampleClass = class { ...
            if (node.type === 'VariableDeclaration' && node.kind == 'var' && node.declarations.length == 1) {
                const dec = node.declarations[0]
                if (dec.id.type == 'Identifier' && dec.id.name == className && dec.init?.type == 'ClassExpression') {
                    result = dec.init
                    this.break()
                }
            }
            // var ExampleClass
            // ...
            // ExampleClass = class ExampleClass { ...
            if (node.type == 'ClassExpression' && node.id?.name == className) {
                result = node
                this.break()
            }
            // var ExampleClass
            // ...
            // ExampleClass = class { ...
            if (
                node.type == 'ExpressionStatement' &&
                node.expression.type == 'AssignmentExpression' &&
                node.expression.left.type == 'Identifier' &&
                node.expression.left.name == className &&
                node.expression.right.type == 'ClassExpression'
            ) {
                result = node.expression.right
                this.break()
            }
        },
    })
    return result
}
