import { ConsoleLogger, LogSchema } from "@/logger";
import { ApiAnalyticsEvent, SdkAnalyticsEvent } from "./types";

export class Analytics {
    // public readonly client: Tinybird | NoopTinybird;
    public logger: ConsoleLogger;

    constructor(props: {
        environment: LogSchema["environment"],
        requestId: string,
    }) {    
        const { environment, requestId } = props;
        this.logger = new ConsoleLogger({
            requestId: requestId,
            application: "api",
            environment: environment,
            defaultFields: { environment: environment },
        });
    }

    public async insertSdkTelemetry(props: {
        requestID: string, 
        event: SdkAnalyticsEvent
    }): Promise<null > {
        const { requestID, event } = props;
        // TODO: insert telemetry sdk events into clickhouse
        this.logger.info("Inserting SDK telemetry", {
            requestID,
            event,
        });
        // TODO: Implement the actual API request insertion logic here
        await Promise.resolve();
        return null;
    }

    public async insertApiRequest(event: ApiAnalyticsEvent): Promise<null> {
        this.logger.info("Inserting API request", {
            event,
        });
        // Placeholder for actual API request insertion logic
        // TODO: Implement the actual API request insertion logic here
        await Promise.resolve();
        return null;
    }

    // constructor(opts: {
    //     tinybirdToken?: string;
    //     tinybirdProxy?: {
    //         url: string;
    //         token: string;
    //     };
    // }) {
    //     this.client = opts.tinybirdProxy
    //         ? new Tinybird({
    //             token: opts.tinybirdProxy.token,
    //             baseUrl: opts.tinybirdProxy.url,
    //         })
    //         : opts.tinybirdToken
    //             ? new Tinybird({ token: opts.tinybirdToken })
    //             : new NoopTinybird();
    // }
        
    // public get ingestLogs() {
    //     return this.client.buildIngestEndpoint({
    //         datasource: "semantic_cache__v1",
    //         event: eventSchema,
    //     });
    // }
}
