// Actor dispatcher must return an actor with an `id` property
// Reference: packages/fedify/src/federation/builder.ts:249-253
import { filter, isNil, isObject, pipe, some } from "@fxts/core";

const actorIdRequired: Deno.lint.Rule = {
  create(context) {
    return {
      CallExpression(node) {
        // setActorDispatcher 호출 찾기
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "setActorDispatcher" &&
          node.arguments.length >= 2
        ) {
          const dispatcherArg = node.arguments[1];

          // dispatcher 함수 분석
          if (
            dispatcherArg.type === "ArrowFunctionExpression" ||
            dispatcherArg.type === "FunctionExpression"
          ) {
            // 함수 본문에서 return 문 찾기
            const hasIdProperty = checkForIdProperty(dispatcherArg.body);

            if (!hasIdProperty) {
              context.report({
                node: dispatcherArg,
                message:
                  "Actor dispatcher must return an actor with an `id` property. Use `Context.getActorUri(identifier)` to set it.",
              });
            }
          }
        }
      },
    };

    // 헬퍼 함수들을 먼저 선언
    function hasIdProperty(prop: unknown): boolean {
      if (!isObject(prop) || isNil(prop)) return false;
      const p = prop as Record<string, unknown>;
      const key = p.key as Record<string, unknown>;
      return p.type === "Property" &&
        key.type === "Identifier" &&
        key.name === "id";
    }

    function checkObjectExpression(obj: Record<string, unknown>): boolean {
      if (!Array.isArray(obj.properties)) return false;
      return pipe(
        obj.properties,
        filter(isObject),
        filter((p): p is Record<string, unknown> => !isNil(p)),
        some(hasIdProperty),
      );
    }

    function checkReturnStatement(n: Record<string, unknown>): boolean {
      if (!n.argument) return false;
      const arg = n.argument as Record<string, unknown>;

      // new Person({ id: ... }) 형태
      if (
        arg.type === "NewExpression" && Array.isArray(arg.arguments) &&
        arg.arguments.length > 0
      ) {
        const objArg = arg.arguments[0] as Record<string, unknown>;
        if (objArg.type === "ObjectExpression") {
          return checkObjectExpression(objArg);
        }
      }

      // { id: ... } 형태
      if (arg.type === "ObjectExpression") {
        return checkObjectExpression(arg);
      }

      return false;
    }

    function checkForIdProperty(node: unknown): boolean {
      if (!isObject(node) || isNil(node)) return false;
      const n = node as Record<string, unknown>;

      // ReturnStatement에서 객체 리터럴 또는 new 표현식 확인
      if (n.type === "ReturnStatement") {
        return checkReturnStatement(n);
      }

      // BlockStatement인 경우 재귀적으로 확인
      if (n.type === "BlockStatement" && Array.isArray(n.body)) {
        return pipe(
          n.body,
          some(checkForIdProperty),
        );
      }

      return false;
    }
  },
};

export default actorIdRequired;
