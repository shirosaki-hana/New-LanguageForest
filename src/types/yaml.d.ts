/**
 * YAML 모듈 타입 선언
 * @rollup/plugin-yaml이 .yaml 파일을 import 가능하게 함
 */
declare module '*.yaml' {
  const content: unknown;
  export default content;
}
