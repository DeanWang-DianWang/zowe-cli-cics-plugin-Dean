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
import { ITestEnvironment } from "../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestEnvironment } from "../../../../../__tests__/__src__/environment/TestEnvironment";
import { generateRandomAlphaNumericString } from "../../../../__src__/TestUtils";
import { definePIpeline, deletePIpeline, IPIpelineParms } from "../../../../../src";

let testEnvironment: ITestEnvironment;
let regionName: string;
let csdGroup: string;
let session: Session;

describe("CICS Define pipeline", () => {

    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            testName: "cics_cmci_define_pipeline",
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
            rejectUnauthorized: cmciProperties.rejectUnauthorized || false,
            protocol: cmciProperties.protocol as any || "https",
        });
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    const options: IPIpelineParms = {} as any;

    it("should define a pipeline to CICS", async () => {
        let error;
        let response;

        const PipelineNameSuffixLength = 4;
        const PipelineName = "PPPP" + generateRandomAlphaNumericString(PipelineNameSuffixLength);

        options.name = PipelineName;
        options.COnfigfile = "/u/exampleapp/CICSApp.xml";
        options.SHelf = "/u/exampleapp/shelf";
        options.Wsdir = "/u/exampleapp/wsdir";
        options.status = true;
        options.csdGroup = csdGroup;
        options.regionName = regionName;

        try {
            response = await definePIpeline(session, options);
        } catch (err) {
            error = err;
        }

        expect(error).toBeFalsy();
        expect(response).toBeTruthy();
        expect(response.response.resultsummary.api_response1).toBe("1024");
        await deletePIpeline(session, options);
    });

    it("should fail to define a pipeline to CICS with invalid CICS region", async () => {
        let error;
        let response;

        const PipelineNameSuffixLength = 4;
        const PipelineName = "PPPP" + generateRandomAlphaNumericString(PipelineNameSuffixLength);

        options.name = PipelineName;
        options.COnfigfile = "/u/exampleapp/CICSApp.xml";
        options.SHelf = "/u/exampleapp/shelf";
        options.Wsdir = "/u/exampleapp/wsdir";
        options.status = true;
        options.csdGroup = csdGroup;
        options.regionName = "FAKE";

        try {
            response = await definePIpeline(session, options);
        } catch (err) {
            error = err;
        }

        expect(error).toBeTruthy();
        expect(response).toBeFalsy();
        expect(error.message).toContain("Did not receive the expected response from CMCI REST API");
        expect(error.message).toContain("INVALIDPARM");
    });

    it("should fail to define a pipeline to CICS due to duplicate name", async () => {
        let error;
        let response;

        const PipelineNameSuffixLength = 4;
        const PipelineName = "PPPP" + generateRandomAlphaNumericString(PipelineNameSuffixLength);

        options.name = PipelineName;
        options.COnfigfile = "/u/exampleapp/CICSApp.xml";
        options.SHelf = "/u/exampleapp/shelf";
        options.Wsdir = "/u/exampleapp/wsdir";
        options.status = true;
        options.csdGroup = csdGroup;
        options.regionName = regionName;

        // define a web service to CICS
        try {
            response = await definePIpeline(session, options);
        } catch (err) {
            error = err;
        }

        expect(error).toBeFalsy();
        expect(response).toBeTruthy();
        response = null; // reset

        // define the same pipeline and validate duplicate error
        try {
            response = await definePIpeline(session, options);
        } catch (err) {
            error = err;
        }

        expect(error).toBeTruthy();
        expect(response).toBeFalsy();
        expect(error.message).toContain("Did not receive the expected response from CMCI REST API");
        expect(error.message).toContain("DUPRES");
        await deletePIpeline(session, options);
    });
});