const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const generate = require("@babel/generator").default;

/**
 * Parses and validates a script that may contain variable declarations and
 * only calls to `sma()` or `ema()`.
 */
function processScript(script) {
  const declaredVars = new Set();

  // Parse into AST
  const ast = parser.parse(script, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  // Transform assignments to undeclared vars into `let` declarations
  traverse(ast, {
    Program(path) {
      const body = path.node.body;
      const newBody = [];

      for (const node of body) {
        // Handle expression statements like `x = sma();`
        if (
          t.isExpressionStatement(node) &&
          t.isAssignmentExpression(node.expression)
        ) {
          const assignment = node.expression;

          if (assignment.operator !== "=") {
            throw new Error(`Only simple assignments (=) are allowed.`);
          }

          const left = assignment.left;
          const right = assignment.right;

          if (!t.isIdentifier(left)) {
            throw new Error(`Only simple identifiers can be assigned to.`);
          }

          const varName = left.name;

          // Validate function calls
          if (t.isCallExpression(right)) {
            const callee = right.callee;
            if (
              !(
                t.isIdentifier(callee, { name: "sma" }) ||
                t.isIdentifier(callee, { name: "ema" })
              )
            ) {
              throw new Error(
                `Only sma() or ema() calls are allowed. Found: ${callee.name}`
              );
            }
          } else if (
            !t.isNumericLiteral(right) &&
            !t.isStringLiteral(right) &&
            !t.isBooleanLiteral(right)
          ) {
            throw new Error(
              `Only sma()/ema() or literals can be assigned. Found: ${right.type}`
            );
          }

          if (!declaredVars.has(varName)) {
            declaredVars.add(varName);
            newBody.push(
              t.variableDeclaration("let", [t.variableDeclarator(left, right)])
            );
          } else {
            // Reassignment
            newBody.push(node);
          }
        } else {
          throw new Error(
            `Only simple assignments like x = sma() are allowed.`
          );
        }
      }

      // Replace the original body
      path.node.body = newBody;
    },
  });

  // Generate final code
  const { code } = generate(ast);
  return code;
}

module.exports = { processScript };
