/**  객체가 비어있으면 void 반환 */
type IfEmpty<T, U = void> = T extends Record<string, never> ? U : T;
