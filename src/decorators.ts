export type MethodInfo = { className: string; classInstance: Function; methodName: string }

export function hotClass() {
    return function (constructor: Function) {
        for (const key of Object.getOwnPropertyNames(constructor.prototype).filter(e => e != 'constructor')) {
            const obj = constructor.prototype[key]
            if (typeof obj !== 'function') continue

            hotreload.registeredMethods.push({ className: constructor.name, classInstance: constructor, methodName: key })
        }
    }
}

export function hot() {
    return function (target: object, propertyKey: string, _descriptor: PropertyDescriptor) {
        hotreload.registeredMethods.push({ className: target.constructor.name, classInstance: target.constructor, methodName: propertyKey })
    }
}
