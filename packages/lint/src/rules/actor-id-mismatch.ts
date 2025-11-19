import { filter, isNil, isObject, pipe, some } from "@fxts/core";

const actorIdMismatch: Deno.lint.Rule = {
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
            // 함수 파라미터 이름 추출 (context, identifier)
            const params = dispatcherArg.params;
            if (params.length < 2) return;

            const contextParam = params[0].type === "Identifier"
              ? params[0].name
              : null;
            const identifierParam = params[1].type === "Identifier"
              ? params[1].name
              : null;

            if (!contextParam || !identifierParam) return;

            // id 프로퍼티가 getActorUri 호출과 일치하는지 확인
            const hasCorrectId = checkIdMatchesGetActorUri(
              dispatcherArg.body,
              contextParam,
              identifierParam,
            );

            if (!hasCorrectId) {
              context.report({
                node: dispatcherArg,
                message:
                  `Actor's \`id\` property must match \`${contextParam}.getActorUri(${identifierParam})\`. Ensure you're using the correct context method.`,
              });
            }
          }
        }
      },
    };

    // isGetActorUriCall을 먼저 선언 (hasCorrectIdProperty에서 사용)
    function isGetActorUriCall(
      node: unknown,
      ctxName: string,
      idName: string,
    ): boolean {
      if (!isObject(node) || isNil(node)) return false;
      const n = node as Record<string, unknown>;
      if (n.type !== "CallExpression") return false;

      const callee = n.callee as Record<string, unknown>;
      if (callee.type !== "MemberExpression") return false;

      const object = callee.object as Record<string, unknown>;
      const property = callee.property as Record<string, unknown>;
      const args = n.arguments as unknown[];

      return object.type === "Identifier" &&
        object.name === ctxName &&
        property.type === "Identifier" &&
        property.name === "getActorUri" &&
        Array.isArray(args) &&
        args.length === 1 &&
        pipe(
          args[0] as Record<string, unknown>,
          (arg) => arg.type === "Identifier" && arg.name === idName,
        );
    }

    function hasCorrectIdProperty(
      ctxName: string,
      idName: string,
      prop: unknown,
    ): boolean {
      if (!isObject(prop) || isNil(prop)) return false;
      const p = prop as Record<string, unknown>;
      const key = p.key as Record<string, unknown>;
      return p.type === "Property" &&
        key.type === "Identifier" &&
        key.name === "id" &&
        isGetActorUriCall(p.value, ctxName, idName);
    }

    function checkObjectExpression(
      obj: Record<string, unknown>,
      ctxName: string,
      idName: string,
    ): boolean {
      if (!Array.isArray(obj.properties)) return false;
      return pipe(
        obj.properties,
        filter(isObject),
        filter((p): p is Record<string, unknown> => !isNil(p)),
        some((prop) => hasCorrectIdProperty(ctxName, idName, prop)),
      );
    }

    function checkReturnStatement(
      n: Record<string, unknown>,
      ctxName: string,
      idName: string,
    ): boolean {
      if (!n.argument) return false;
      const arg = n.argument as Record<string, unknown>;

      // new Person({ id: ctx.getActorUri(identifier) }) 형태
      if (
        arg.type === "NewExpression" && Array.isArray(arg.arguments) &&
        arg.arguments.length > 0
      ) {
        const objArg = arg.arguments[0] as Record<string, unknown>;
        if (objArg.type === "ObjectExpression") {
          return checkObjectExpression(objArg, ctxName, idName);
        }
      }

      // { id: ctx.getActorUri(identifier) } 형태
      if (arg.type === "ObjectExpression") {
        return checkObjectExpression(arg, ctxName, idName);
      }

      return false;
    }

    function checkIdMatchesGetActorUri(
      node: unknown,
      ctxName: string,
      idName: string,
    ): boolean {
      if (!isObject(node) || isNil(node)) return false;
      const n = node as Record<string, unknown>;

      // ReturnStatement 찾기
      if (n.type === "ReturnStatement") {
        return checkReturnStatement(n, ctxName, idName);
      }

      // BlockStatement인 경우 재귀적으로 확인
      if (n.type === "BlockStatement" && Array.isArray(n.body)) {
        return pipe(
          n.body,
          some((stmt) => checkIdMatchesGetActorUri(stmt, ctxName, idName)),
        );
      }

      return false;
    }
  },
};

export default actorIdMismatch;
