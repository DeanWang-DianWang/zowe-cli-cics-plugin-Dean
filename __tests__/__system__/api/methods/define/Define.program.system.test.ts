/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { Session } from "@zowe/imperative";
import { ITestEnvironment } from "../../../../__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../__src__/environment/TestEnvironment";
import { generateRandomAlphaNumericString } from "../../../../__src__/TestUtils";
import { defineProgram, deleteProgram, IProgramParms } from "../../../../../src";

let testEnvironment: ITestEnvironment;
let regionName: string;
let csdGroup: string;
let session: Session;

describe("CICS Define program", () => {

  beforeAll(async () => {
    testEnvironment = await TestEnvironment.setUp({
      testName: "cics_cmci_define_program",
      installPlugin: true,
      tempProfileTypes: ["cics"]
    });
    csdGroup = testEnvironment.systemTestProperties.cmci.csdGroup;
    regionName = testEnvironment.systemTestProperties.cmci.regionName;
    const cmciProperties = await testEnvironment.systemTestProperties.cmci;

    session = new Session({
      user: cmciProperties.user,
      password: cmciProperties.password,
      hostname: cmciProperties.host,
      port: cmciProperties.port,
      type: "basic",
      strictSSL: false,
      protocol: testEnvironment.systemTestProperties.cmci.protocol as any || "http",
    });
  });

  afterAll(async () => {
    await TestEnvironment.cleanUp(testEnvironment);
  });

  const options: IProgramParms = {} as any;

  it("should define a program to CICS", async () => {
    let error;
    let response;

    const programNameSuffixLength = 4;
    const programName = "AAAA" + generateRandomAlphaNumericString(programNameSuffixLength);

    options.name = programName;
    options.csdGroup = csdGroup;
    options.regionName = regionName;

    try {
      response = await defineProgram(session, options);
    } catch (err) {
      error = err;
    }

    expect(error).toBeFalsy();
    expect(response).toBeTruthy();
    expect(response.response.resultsummary.api_response1).toBe("1024");
    await deleteProgram(session, options);
  });

  it("should fail to define a program to CICS with invalid CICS region", async () => {
    let error;
    let response;

    const programNameSuffixLength = 4;
    const programName = "AAAA" + generateRandomAlphaNumericString(programNameSuffixLength);

    options.name = programName;
    options.csdGroup = csdGroup;
    options.regionName = "FAKE";

    try {
      response = await defineProgram(session, options);
    } catch (err) {
      error = err;
    }

    expect(error).toBeTruthy();
    expect(response).toBeFalsy();
    expect(error.message).toContain("Did not receive the expected response from CMCI REST API");
    expect(error.message).toContain("INVALIDPARM");
  });

  it("should fail to define a program to CICS due to duplicate name", async () => {
    let error;
    let response;

    const programNameSuffixLength = 4;
    const programName = "AAAA" + generateRandomAlphaNumericString(programNameSuffixLength);

    options.name = programName;
    options.csdGroup = csdGroup;
    options.regionName = regionName;

    // define a program to CICS
    try {
      response = await defineProgram(session, options);
    } catch (err) {
      error = err;
    }

    expect(error).toBeFalsy();
    expect(response).toBeTruthy();
    response = null; // reset

    // define the same program and validate duplicate error
    try {
      response = await defineProgram(session, options);
    } catch (err) {
      error = err;
    }

    expect(error).toBeTruthy();
    expect(response).toBeFalsy();
    expect(error.message).toContain("Did not receive the expected response from CMCI REST API");
    expect(error.message).toContain("DUPRES");
    await deleteProgram(session, options);
  });
});
