const _get = require('lodash/get');

module.exports =  function({ types: t, template }) {
    return {
        visitor: {
            CallExpression(startPath, state) {

                /**
                 *  isServer true, need trans { component: () => import() } to
                 *  { componet: { _mm:  () => require(), _pp: () => require.resoveWeak() }
                 *
                 *  isServer default false, need trans { component: () => import() } to
                 *  { componet: { _mm: () => import(), _pp: () => require.resoveWeak()}
                 *  const { isServer } = state.opts;
                 **/
                const { isServer } = state.opts;

                startPath.traverse({
                    Import(importPath) {
                        const funcNameOutOfImport = 'parentPath.parentPath.parentPath.parentPath.parentPath.node.key.name';
                        if(_get(importPath, funcNameOutOfImport) !== '_importModule') {
                            const funcPath = importPath.parentPath.node.arguments[0].value;
                            console.log('\n===wrap import: ', importPath.parentPath.node.arguments[0].value);

                            const asyncImport = t.callExpression(t.import(), [
                                t.stringLiteral(funcPath)
                            ])

                            const syncImport = t.callExpression(t.identifier('require'), [
                                t.stringLiteral(funcPath)
                            ])

                            const importPathResolved = t.callExpression(
                                t.memberExpression(
                                    t.identifier('require'),
                                    t.identifier('resolveWeak')
                                ), [
                                    t.stringLiteral(funcPath)
                                ]);

                            const obj = t.objectExpression([
                                t.objectProperty(
                                    t.identifier('_importModule'),
                                    t.arrowFunctionExpression([], isServer ? syncImport : asyncImport)
                                ),
                                t.objectProperty(
                                    t.identifier('_requestModuleId'),
                                    t.arrowFunctionExpression([], importPathResolved)
                                ),
                                t.objectProperty(
                                    t.identifier('_requestText'),
                                    t.stringLiteral(funcPath)
                                )
                            ])

                            startPath.parentPath.parentPath.parentPath.replaceWith(obj)
                        }
                    },
                })
            },
        }
    };
};
