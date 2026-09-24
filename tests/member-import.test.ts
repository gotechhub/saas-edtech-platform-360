import { describe,expect,it } from "vitest";
import { memberImportTemplate,parseMemberImportCsv } from "../packages/learning-core/src/member-import.ts";

describe("member CSV import preview",()=>{
 it("parses quoted Turkish data and normalized lists",()=>{
  const result=parseMemberImportCsv('email,job_title,professional_level,role_keys,team_codes\r\n" ECE@Example.com ","Kıdemli, Avukat",Kıdemli,learner|instructor,litigation|kvkk');
  expect(result.valid).toBe(true);expect(result.rows[0]).toMatchObject({email:"ece@example.com",jobTitle:"Kıdemli, Avukat",roleKeys:["learner","instructor"],teamCodes:["litigation","kvkk"]});
 });
 it("supports semicolon templates",()=>{
  const result=parseMemberImportCsv("email;role_keys;team_codes\na@example.com;learner;legal");
  expect(result.delimiter).toBe(";");expect(result.rows).toHaveLength(1);
 });
 it("reports invalid and duplicate rows without returning them as writable rows",()=>{
  const result=parseMemberImportCsv("email,role_keys\nbad,learner\nx@example.com,platform_admin\nx@example.com,learner");
  expect(result.valid).toBe(false);expect(result.rows).toEqual([]);expect(result.issues.map(x=>x.field)).toEqual(["email","role_keys","email"]);
 });
 it("rejects unknown or duplicate headers",()=>{
  expect(()=>parseMemberImportCsv("email,email\na@b.com,a@b.com")).toThrow(/CSV_HEADERS_INVALID/);
  expect(()=>parseMemberImportCsv("email,secret\na@b.com,x")).toThrow(/CSV_HEADERS_INVALID/);
 });
 it("rejects malformed quotes and excess rows",()=>{
  expect(()=>parseMemberImportCsv('email,role_keys\n"a@b.com,learner')).toThrow(/CSV_QUOTE_UNCLOSED/);
  const rows=Array.from({length:2001},(_,i)=>`u${i}@example.com,learner`).join("\n");
  expect(()=>parseMemberImportCsv(`email,role_keys\n${rows}`)).toThrow(/CSV_TOO_MANY_ROWS/);
 });
 it("provides the canonical downloadable header",()=>expect(memberImportTemplate).toBe("email,job_title,professional_level,role_keys,team_codes\n"));
});
