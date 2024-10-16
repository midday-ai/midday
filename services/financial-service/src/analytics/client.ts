import { ConsoleLogger, LogSchema } from "@/logger";
import { ApiAnalyticsEvent, SdkAnalyticsEvent } from "./types";

/**
 * Analytics class for handling telemetry and API request logging.
 * 
 * This class provides methods for inserting SDK telemetry and API request data,
 * utilizing a ConsoleLogger for logging purposes.
 */
export class Analytics {
    // public readonly client: Tinybird | NoopTinybird | ClickhouseClient;

    /** Logger instance for console output */
    public logger: ConsoleLogger;

    /**
     * Creates an instance of the Analytics class.
     * 
     * @param props - Configuration properties for the Analytics instance
     * @param props.environment - The environment in which the analytics are being collected
     * @param props.requestId - A unique identifier for the current request
     */
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

    /**
     * Inserts SDK telemetry data.
     * 
     * This method is responsible for logging SDK telemetry events. Currently, it only
     * logs the event information and does not actually insert the data into a database.
     * 
     * @param props - Properties for the SDK telemetry event
     * @param props.requestID - A unique identifier for the request associated with this telemetry event
     * @param props.event - The SDK analytics event data to be inserted
     * @returns A promise that resolves to null after the operation is complete
     */
    public async insertSdkTelemetry(props: {
        requestID: string, 
        event: SdkAnalyticsEvent
    }): Promise<null> {
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

    /**
     * Inserts API request data.
     * 
     * This method is responsible for logging API request events. Currently, it only
     * logs the event information and does not actually insert the data into a database.
     * 
     * @param event - The API analytics event data to be inserted
     * @returns A promise that resolves to null after the operation is complete
     */
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
