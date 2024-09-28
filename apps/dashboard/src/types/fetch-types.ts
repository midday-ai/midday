import { ERROR_TYPE } from "@/types/error-types";
import {
    BusinessAccount,
    CheckEmailAndAuth0UserIdExistsResponse,
    FinancialUserProfile,
    MelodyFinancialContext,
    UserAccount
} from "client-typescript-sdk";

/**
 * Represents the response structure for fetching user information.
 * @interface FetchUserResponse
 * @property {boolean} authenticated - Indicates if the user is authenticated.
 * @property {boolean} userExists - Indicates if the user exists in the system.
 * @property {CheckEmailAndAuth0UserIdExistsResponse} [userAccount] - Optional user account details.
 * @property {string} [error] - Optional error message if the fetch operation fails.
 * @property {ERROR_TYPE} [type] - Optional error type if an error occurs.
 */
interface FetchUserResponse {
    authenticated: boolean;
    userExists: boolean;
    userAccount?: CheckEmailAndAuth0UserIdExistsResponse;
    error?: string;
    type?: ERROR_TYPE;
}

/**
 * Represents the properties required for fetching user data.
 * @interface FetchDataProps
 * @property {string} userId - The unique identifier of the user.
 * @property {string} email - The email address of the user.
 * @property {string} accessToken - The access token for authentication.
 * @property {boolean} [isAuthenticated] - Optional flag indicating if the user is already authenticated.
 */
interface FetchDataProps {
    userId: string;
    email: string;
    accessToken: string;
    isAuthenticated?: boolean;
}

/**
 * Represents the response structure for fetching user data.
 * @interface FetchDataResponse
 * @property {boolean} authenticated - Indicates if the user is authenticated.
 * @property {FinancialUserProfile} [userFinancialProfile] - Optional financial profile of the user.
 * @property {MelodyFinancialContext} [userFinancialContext] - Optional financial context of the user.
 * @property {UserAccount | BusinessAccount} [userAccount] - Optional user or business account details.
 * @property {string} [token] - Optional authentication token.
 * @property {string} [userId] - Optional user identifier.
 * @property {string} [error] - Optional error message if the fetch operation fails.
 * @property {ERROR_TYPE} [type] - Optional error type if an error occurs.
 */
interface FetchDataResponse {
    authenticated: boolean;
    userFinancialProfile?: FinancialUserProfile;
    userFinancialContext?: MelodyFinancialContext;
    userAccount?: UserAccount | BusinessAccount;
    token?: string;
    userId?: string;
    error?: string;
    type?: ERROR_TYPE;
}

/**
 * Represents the response structure for fetching user account details.
 * @interface FetchUserAccountDetailsResponse
 * @property {UserAccount | BusinessAccount} account - The user or business account details.
 * @property {FinancialUserProfile} financialProfile - The financial profile of the user.
 * @property {MelodyFinancialContext} [financialContext] - Optional financial context of the user.
 */
interface FetchUserAccountDetailsResponse {
    account: UserAccount | BusinessAccount;
    financialProfile: FinancialUserProfile;
    financialContext?: MelodyFinancialContext;
}

export type { FetchDataProps, FetchDataResponse, FetchUserAccountDetailsResponse, FetchUserResponse };

