export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A valid color value in hex format (e.g., #FFFFFF for white) */
  Color: { input: string; output: string; }
  /** An encoded id */
  EncodedId: { input: string; output: string; }
  /** RRULE used in calendars for events and scheduling to compute the recurrence set */
  ICalendarRule: { input: unknown; output: unknown; }
  /** An ISO 8601-encoded date */
  ISO8601Date: { input: string; output: string; }
  /** An ISO 8601-encoded datetime */
  ISO8601DateTime: { input: string; output: string; }
  /**
   *       An ISO 8601-encoded time.
   *
   *       Example: 09:00:00.000000000
   *
   */
  ISO8601Time: { input: unknown; output: unknown; }
  /** Represents untyped JSON */
  JSON: { input: unknown; output: unknown; }
  /** Represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. */
  Minutes: { input: unknown; output: unknown; }
  /** Represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. */
  Seconds: { input: unknown; output: unknown; }
  /** Any timezone found in the TZ database (eg: `America/Denver`) */
  Timezone: { input: unknown; output: unknown; }
  /** Represents `true` value. */
  True: { input: unknown; output: unknown; }
  /** A uniform resource locator, also known as a web address in HTTPS format */
  Url: { input: string; output: string; }
};

/** The company of a Service Provider who uses Jobber for their business operations. */
export type Account = {
  __typename?: 'Account';
  /** The time the account was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The dedicated phone number of the account */
  dedicatedPhoneNumber?: Maybe<Scalars['String']['output']>;
  /** The earliest invoice issued date */
  earliestInvoiceIssuedDate?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** A list of features */
  features?: Maybe<Array<AccountFeature>>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** Industry associated with the account */
  industry?: Maybe<Industry>;
  /** The name of the company */
  name: Scalars['String']['output'];
  /** The phone number of the account */
  phone?: Maybe<Scalars['String']['output']>;
  /** The name of the signup attribute */
  signupName?: Maybe<Scalars['String']['output']>;
};

/** Feature for an account */
export type AccountFeature = {
  __typename?: 'AccountFeature';
  /** The availability state */
  available: Scalars['Boolean']['output'];
  /** The discoverable state */
  discoverable: Scalars['Boolean']['output'];
  /** The enabled state */
  enabled: Scalars['Boolean']['output'];
  /** The feature name */
  name: Scalars['String']['output'];
};

/** Legacy account type to match fields in the Account REST endpoint. This type is deprecated and will be removed in a future version. Use `AccountType` for accessing account information. */
export type AccountUnsafe = {
  __typename?: 'AccountUnsafe';
  /**
   * Whether the account can toggle Jobber payments
   * @deprecated This field is deprecated and will be removed in a future version.
   */
  canToggleJobberPayments?: Maybe<Scalars['Boolean']['output']>;
  /**
   * The country of the account
   * @deprecated This field is deprecated and will be removed in a future version.
   */
  country?: Maybe<Scalars['String']['output']>;
  /**
   * Whether the account can toggle ACH payments
   * @deprecated This field is deprecated and will be removed in a future version.
   */
  enabledAchPayments?: Maybe<Scalars['Boolean']['output']>;
  /**
   * Whether or not the account's payment details have an error
   * @deprecated This field is deprecated and will be removed in a future version.
   */
  hasPaymentError: Scalars['Boolean']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /**
   * The current plan code of the account
   * @deprecated This field is deprecated and will be removed in a future version.
   */
  planCode: Scalars['String']['output'];
  /**
   * The tier name for the plan set, e.g., 'CONNECT'
   * @deprecated This field is deprecated and will be removed in a future version.
   */
  planTier: Scalars['String']['output'];
  /**
   * Whether the subscription is cancelled
   * @deprecated This field is deprecated and will be removed in a future version.
   */
  subscriptionCancelled?: Maybe<Scalars['Boolean']['output']>;
};

/** An ACH bank payment applied to a quote or invoice */
export type AchBankPaymentPaymentRecord = PaymentRecordInterface & {
  __typename?: 'AchBankPaymentPaymentRecord';
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance (absolute value) */
  amount: Scalars['Float']['output'];
  /** Whether the payment can be edited */
  canEdit: Scalars['Boolean']['output'];
  /** The client associated with the payment */
  client?: Maybe<Client>;
  /** The confirmation number of the ACH bank payment */
  confirmationNumber?: Maybe<Scalars['String']['output']>;
  /** Additional details about the payment */
  details?: Maybe<Scalars['String']['output']>;
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The invoice associated with the payment */
  invoice?: Maybe<Invoice>;
  /** Where the payment originated from */
  paymentOrigin?: Maybe<PaymentOrigin>;
  /** The type of payment used, i.e cash, check, Jobber Payments... */
  paymentType?: Maybe<PaymentType>;
  /** The quote associated with the deposit payment */
  quote?: Maybe<Quote>;
  /** The raw amount applied against the quote or invoice balance (preserves sign). */
  rawAmount: Scalars['Float']['output'];
  /** Refunds associated with the payment */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** If sent, the DateTime the payment record was sent to client. */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};


/** An ACH bank payment applied to a quote or invoice */
export type AchBankPaymentPaymentRecordAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** An ACH bank payment applied to a quote or invoice */
export type AchBankPaymentPaymentRecordRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** Attributes of a property */
export type AddressAttributes = {
  /** The city */
  city?: InputMaybe<Scalars['String']['input']>;
  /** The country */
  country?: InputMaybe<Scalars['String']['input']>;
  /** The zip or postal code */
  postalCode?: InputMaybe<Scalars['String']['input']>;
  /** The state or province */
  province?: InputMaybe<Scalars['String']['input']>;
  /** The first line of the street address */
  street1?: InputMaybe<Scalars['String']['input']>;
  /** The second line of the street address */
  street2?: InputMaybe<Scalars['String']['input']>;
};

export type AddressInterface = {
  /** The city of the address */
  city?: Maybe<Scalars['String']['output']>;
  /** The point coordinates of the address if it has been geo-coded */
  coordinates?: Maybe<GeoPoint>;
  /** The country of the address */
  country?: Maybe<Scalars['String']['output']>;
  /** The status of geo-locating the coordinates for an address */
  geoStatus?: Maybe<GeoStatus>;
  /** The name of the property for the address */
  name?: Maybe<Scalars['String']['output']>;
  /** The postal code of the address */
  postalCode?: Maybe<Scalars['String']['output']>;
  /** The province of the address */
  province?: Maybe<Scalars['String']['output']>;
  /** The street address */
  street: Scalars['String']['output'];
  /** The first line of the street address */
  street1?: Maybe<Scalars['String']['output']>;
  /** The second line of the street address */
  street2?: Maybe<Scalars['String']['output']>;
};

/** An Advance Payout Transaction */
export type AdvanceBalanceTransaction = BalanceTransactionInterface & {
  __typename?: 'AdvanceBalanceTransaction';
  /** The date the balance transaction was created */
  created: Scalars['ISO8601DateTime']['output'];
  /** The type of currency used */
  currency: Scalars['String']['output'];
  /** The balance transaction fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The balance transaction gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The balance transaction net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The balance transaction type */
  type?: Maybe<BalanceTransaction>;
};

/** An Advance Funding Payout Transaction */
export type AdvanceFundingBalanceTransaction = BalanceTransactionInterface & {
  __typename?: 'AdvanceFundingBalanceTransaction';
  /** The date the balance transaction was created */
  created: Scalars['ISO8601DateTime']['output'];
  /** The type of currency used */
  currency: Scalars['String']['output'];
  /** The balance transaction fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The balance transaction gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The balance transaction net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The balance transaction type */
  type?: Maybe<BalanceTransaction>;
};

/** Alerts from a third-party application that require an account user's attention */
export type AppAlert = {
  __typename?: 'AppAlert';
  /** the application the app alerts belong to */
  app: Application;
  /** total number of alerts */
  count: Scalars['Int']['output'];
  /** last time the alert count was updated */
  updatedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};

/** The connection type for AppAlert. */
export type AppAlertConnection = {
  __typename?: 'AppAlertConnection';
  /** A list of edges. */
  edges?: Maybe<Array<AppAlertEdge>>;
  /** A list of nodes. */
  nodes: Array<AppAlert>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type AppAlertEdge = {
  __typename?: 'AppAlertEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: AppAlert;
};

/** Attributes for updating an app alert */
export type AppAlertEditInput = {
  /** The new number of alerts between 0 and 100 */
  count: Scalars['Int']['input'];
};

/** Autogenerated return type of AppAlertEdit. */
export type AppAlertEditPayload = {
  __typename?: 'AppAlertEditPayload';
  /** The modified app alert */
  appAlert?: Maybe<AppAlert>;
  /** Errors encountered when modifying the app alert */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of AppDisconnect. */
export type AppDisconnectPayload = {
  __typename?: 'AppDisconnectPayload';
  /** The application that was disconnected from the user */
  app?: Maybe<Application>;
  /** The errors returned when trying to disconnect the account from the application */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of AppInstanceLastSyncDateEdit. */
export type AppInstanceLastSyncDateEditPayload = {
  __typename?: 'AppInstanceLastSyncDateEditPayload';
  /** The modified last sync date */
  lastSyncDate?: Maybe<LastSyncDate>;
  /** Errors encountered when creating the app request */
  userErrors: Array<MutationErrors>;
};

/** Applications which improve Jobber's experience */
export type Application = {
  __typename?: 'Application';
  /** The scopes requested for this application */
  applicationScopes: Scalars['String']['output'];
  /** The display name of the application author */
  author: Scalars['String']['output'];
  /** The before starting documentation for the application */
  beforeStartingContent: Scalars['String']['output'];
  /** The description of the application */
  description?: Maybe<Scalars['String']['output']>;
  /** The display name of the application. Defaults to full name if not specified */
  displayName: Scalars['String']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The installation steps for the application */
  installationStepsContent: Scalars['String']['output'];
  /** The URL that links to additional information about the application */
  learnMoreUrl: Scalars['String']['output'];
  /** The logo URL to display the logo of the application */
  logoUrl?: Maybe<Scalars['String']['output']>;
  /** The URL for the manage app button for an installed App */
  manageAppUrl?: Maybe<Scalars['String']['output']>;
  /** The URL that links to a selected app landing page */
  marketplaceUrl: Scalars['String']['output'];
  /** The full name of the application */
  name: Scalars['String']['output'];
  /** The URL that should start the OAuth flow */
  oauthUrl?: Maybe<Scalars['String']['output']>;
  /** The redirect URL used for OAuth purposes */
  redirectUrl?: Maybe<Scalars['String']['output']>;
};

/** The connection type for Application. */
export type ApplicationConnection = {
  __typename?: 'ApplicationConnection';
  /** A list of edges. */
  edges?: Maybe<Array<ApplicationEdge>>;
  /** A list of nodes. */
  nodes: Array<Application>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type ApplicationEdge = {
  __typename?: 'ApplicationEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Application;
};

/** Input for updating schedule of an existing appointment */
export type AppointmentAllDayInput = {
  /** The new end date of the appointment */
  endDate?: InputMaybe<Scalars['ISO8601Date']['input']>;
  /** The new start date of the appointment */
  startDate: Scalars['ISO8601Date']['input'];
  /** The timezone for input */
  timezone: Scalars['Timezone']['input'];
};

/** Input for updating the team members assigned to an existing appointment */
export type AppointmentEditAssignmentInput = {
  /** The ids to assign to the existing appointment */
  assignedUserIds: Array<Scalars['EncodedId']['input']>;
};

/** Autogenerated return type of AppointmentEditAssignment. */
export type AppointmentEditAssignmentPayload = {
  __typename?: 'AppointmentEditAssignmentPayload';
  /** The updated appointment */
  appointment?: Maybe<ScheduledItemInterface>;
  /** Errors encountered when trying to edit the appointment assignment */
  userErrors: Array<MutationErrors>;
};

/** Input for updating the completeness of an existing appointment */
export type AppointmentEditCompletenessInput = {
  /** Whether the appointment's status is complete */
  completed: Scalars['Boolean']['input'];
};

/** Autogenerated return type of AppointmentEditCompleteness. */
export type AppointmentEditCompletenessPayload = {
  __typename?: 'AppointmentEditCompletenessPayload';
  /** The updated appointment */
  appointment?: Maybe<ScheduledItemInterface>;
  /** Errors encountered when trying to edit the appointment */
  userErrors: Array<MutationErrors>;
};

/** Input for updating schedule of an existing appointment */
export type AppointmentEditScheduleInput = {
  /** Set a new date and time schedule for the appointment */
  schedule?: InputMaybe<AppointmentScheduleInput>;
  /** Set a new all day schedule for the appointment */
  scheduleAllDay?: InputMaybe<AppointmentAllDayInput>;
  /** Unschedule the appointment */
  unschedule?: InputMaybe<Scalars['True']['input']>;
};

/** Autogenerated return type of AppointmentEditSchedule. */
export type AppointmentEditSchedulePayload = {
  __typename?: 'AppointmentEditSchedulePayload';
  /** The updated appointment */
  appointment?: Maybe<ScheduledItemInterface>;
  /** Errors encountered when trying to edit the appointment schedule */
  userErrors: Array<MutationErrors>;
};

/** Input for updating schedule of an existing appointment */
export type AppointmentScheduleInput = {
  /** The new end time of the appointment */
  endAt: Scalars['ISO8601Time']['input'];
  /** The new start time of the appointment */
  startAt: Scalars['ISO8601Time']['input'];
  /** The timezone for input */
  timezone: Scalars['Timezone']['input'];
};

/** The time window during which the SP can arrive */
export type ArrivalWindow = {
  __typename?: 'ArrivalWindow';
  /** Whether the arrival window is centered on the job */
  centeredOnStartTime: Scalars['Boolean']['output'];
  /** The duration of the arrival window */
  duration: Scalars['Minutes']['output'];
  /** The end time of the arrival window */
  endAt: Scalars['ISO8601DateTime']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The start time of the arrival window */
  startAt: Scalars['ISO8601DateTime']['output'];
};

/** Attributes used for arrival window generation */
export type ArrivalWindowAttributes = {
  /** The duration of the arrival window */
  durationInMinutes: Scalars['Minutes']['input'];
};

/** An assessment represents each time a Service Provider goes to a client property to assess and plan for future work */
export type Assessment = ScheduledItemInterface & {
  __typename?: 'Assessment';
  /** Indicates whether the scheduled item is for a full day */
  allDay: Scalars['Boolean']['output'];
  /** Users assigned to the scheduled item */
  assignedUsers?: Maybe<UserConnection>;
  /** The client for the assessment */
  client: Client;
  /** Whether the client has confirmed this assessment */
  clientConfirmed: Scalars['Boolean']['output'];
  /** The time that the assessment was completed. */
  completedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The user that created this scheduled item */
  createdBy?: Maybe<User>;
  /** Minute duration between start and end time. */
  duration?: Maybe<Scalars['Int']['output']>;
  /** End date and time of the scheduled item. An unscheduled visit is represented by both startAt and endAt being null */
  endAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The instructions for the assessment */
  instructions?: Maybe<Scalars['String']['output']>;
  /** Whether the assessment has been completed */
  isComplete: Scalars['Boolean']['output'];
  /** Indicates whether the title is the default */
  isDefaultTitle: Scalars['Boolean']['output'];
  /** All messages related to this work object. */
  linkedCommunications: MessageInterfaceConnection;
  /** An override for ordering anytime and unscheduled items */
  overrideOrder?: Maybe<Scalars['Int']['output']>;
  /** The property for the assessment */
  property?: Maybe<Property>;
  /** The parent request associated with this assessment. */
  request: Request;
  /** The order in which the scheduled item should be routed */
  routingOrder?: Maybe<Scalars['Int']['output']>;
  /** Start date and time of the scheduled item. An unscheduled visit is represented by both startAt and endAt being null */
  startAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Offset in minutes from the time of the scheduled item to notify the team */
  teamReminderOffset?: Maybe<Scalars['Minutes']['output']>;
  /** The title of the scheduled item */
  title?: Maybe<Scalars['String']['output']>;
};


/** An assessment represents each time a Service Provider goes to a client property to assess and plan for future work */
export type AssessmentAssignedUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** An assessment represents each time a Service Provider goes to a client property to assess and plan for future work */
export type AssessmentLinkedCommunicationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** Autogenerated return type of AssessmentComplete. */
export type AssessmentCompletePayload = {
  __typename?: 'AssessmentCompletePayload';
  /** The assessment */
  assessment?: Maybe<Assessment>;
  /** Errors encountered when modifying the assessment completeness */
  userErrors: Array<MutationErrors>;
};

/** Inputs for creating an assessment */
export type AssessmentCreateInput = {
  /** The instructions for the assessment */
  instructions?: InputMaybe<Scalars['String']['input']>;
  /** The schedule for the visit */
  schedule?: InputMaybe<ScheduledItemAttributes>;
};

/** Autogenerated return type of AssessmentCreate. */
export type AssessmentCreatePayload = {
  __typename?: 'AssessmentCreatePayload';
  /** The added assessment */
  assessment?: Maybe<Assessment>;
  /** The related request */
  request?: Maybe<Request>;
  /** Errors encountered when creating the assessment */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of AssessmentDelete. */
export type AssessmentDeletePayload = {
  __typename?: 'AssessmentDeletePayload';
  /** The deleted assessment */
  deletedAssessment?: Maybe<Assessment>;
  /** The related request */
  request?: Maybe<Request>;
  /** Errors encountered when deleting the assessment */
  userErrors: Array<MutationErrors>;
};

/** Inputs for editing an assessment */
export type AssessmentEditInput = {
  /** The instructions for the assessment */
  instructions?: InputMaybe<Scalars['String']['input']>;
  /** The schedule for the assessment */
  schedule?: InputMaybe<ScheduledItemAttributes>;
};

/** Autogenerated return type of AssessmentEdit. */
export type AssessmentEditPayload = {
  __typename?: 'AssessmentEditPayload';
  /** The edited assessment */
  assessment?: Maybe<Assessment>;
  /** The related request */
  request?: Maybe<Request>;
  /** Errors encountered when modifying the assessment */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of AssessmentUncomplete. */
export type AssessmentUncompletePayload = {
  __typename?: 'AssessmentUncompletePayload';
  /** The assessment */
  assessment?: Maybe<Assessment>;
  /** Errors encountered when modifying the assessment completeness */
  userErrors: Array<MutationErrors>;
};

export type BalanceTransaction =
  /** The Balance Transaction is of type Advance */
  | 'ADVANCE'
  /** The Balance Transaction is of type Advance Funding */
  | 'ADVANCE_FUNDING'
  /** The Balance Transaction is of type Deposit */
  | 'DEPOSIT'
  /** The Balance Transaction is of type Deposit */
  | 'DISPUTE'
  /** The Balance Transaction is of type Fee Adjustment */
  | 'FEE_ADJUSTMENT'
  /** The Balance Transaction is of type Financing Payout */
  | 'FINANCING_PAYOUT'
  /** The Balance Transaction is of type Financing Repayment */
  | 'FINANCING_REPAYMENT'
  /** The Balance Transaction is of type Instant Payout */
  | 'INSTANT_PAYOUT'
  /** The Balance Transaction is of type Instant Payout Fee */
  | 'INSTANT_PAYOUT_FEE'
  /** The Balance Transaction is of type Lien Payment */
  | 'LIEN_PAYMENT'
  /** The Balance Transaction is of type Payment */
  | 'PAYMENT'
  /** The Balance Transaction is of type Refund */
  | 'REFUND'
  /** The Balance Transaction is of type Refund Fee */
  | 'REFUND_FEE'
  /** The Balance Transaction is of type Reserved Funds */
  | 'RESERVED_FUNDS'
  /** The Balance Transaction is of type Unknown */
  | 'UNKNOWN'
  /** The Balance Transaction is of type Won Dispute */
  | 'WON_DISPUTE';

/** Balance transactions represent funds moving through your account */
export type BalanceTransactionInterface = {
  /** The date the balance transaction was created */
  created: Scalars['ISO8601DateTime']['output'];
  /** The type of currency used */
  currency: Scalars['String']['output'];
  /** The balance transaction fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The balance transaction gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The ID of the payment record */
  id: Scalars['EncodedId']['output'];
  /** The balance transaction net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The balance transaction type */
  type?: Maybe<BalanceTransaction>;
};

/** The connection type for BalanceTransactionInterface. */
export type BalanceTransactionInterfaceConnection = {
  __typename?: 'BalanceTransactionInterfaceConnection';
  /** A list of edges. */
  edges?: Maybe<Array<BalanceTransactionInterfaceEdge>>;
  /** A list of nodes. */
  nodes: Array<BalanceTransactionInterface>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type BalanceTransactionInterfaceEdge = {
  __typename?: 'BalanceTransactionInterfaceEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: BalanceTransactionInterface;
};

/** A bank transfer payment applied to a quote or invoice */
export type BankTransferPaymentRecord = PaymentRecordInterface & {
  __typename?: 'BankTransferPaymentRecord';
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance (absolute value) */
  amount: Scalars['Float']['output'];
  /** Whether the payment can be edited */
  canEdit: Scalars['Boolean']['output'];
  /** The client associated with the payment */
  client?: Maybe<Client>;
  /** The confirmation number of the bank transfer */
  confirmationNumber?: Maybe<Scalars['String']['output']>;
  /** Additional details about the payment */
  details?: Maybe<Scalars['String']['output']>;
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The invoice associated with the payment */
  invoice?: Maybe<Invoice>;
  /** Where the payment originated from */
  paymentOrigin?: Maybe<PaymentOrigin>;
  /** The type of payment used, i.e cash, check, Jobber Payments... */
  paymentType?: Maybe<PaymentType>;
  /** The quote associated with the deposit payment */
  quote?: Maybe<Quote>;
  /** The raw amount applied against the quote or invoice balance (preserves sign). */
  rawAmount: Scalars['Float']['output'];
  /** Refunds associated with the payment */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** If sent, the DateTime the payment record was sent to client. */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};


/** A bank transfer payment applied to a quote or invoice */
export type BankTransferPaymentRecordAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A bank transfer payment applied to a quote or invoice */
export type BankTransferPaymentRecordRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type BillingFrequencyEnum =
  /** Never invoice the client automatically */
  | 'NEVER'
  /** Invoice the client when the job is complete */
  | 'ON_COMPLETION'
  /** Invoice the client periodically based on rules */
  | 'PERIODIC'
  /** Invoice the client on each visit */
  | 'PER_VISIT';

export type BillingStrategy =
  /** Each invoice is for a set amount */
  | 'FIXED_PRICE'
  /** Invoices include all the billable work on completed visits */
  | 'VISIT_BASED';

/** The type of booking this form creates when it's submitted */
export type BookingType =
  /** Form creates a request with an assessment when submitted */
  | 'ASSESSMENT'
  /** Form creates a job when submitted */
  | 'JOB'
  /** No booking; form creates a request only */
  | 'NONE';

export type CapitalLoanAcceptanceSource =
  /** Accepted the capital loan via e-mail */
  | 'EMAIL'
  /** Accepted the capital loan via Jobber Online */
  | 'JOBBER_ONLINE';

/** Attributes for filtering capital loans */
export type CapitalLoanFilterAttributes = {
  /** The loan's created at date to filter by */
  createdAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The loan's status to filter by */
  status?: InputMaybe<CapitalLoanStatus>;
};

export type CapitalLoanStatus =
  /** Offer has been accepted by the connected account */
  | 'ACCEPTED'
  /** Offer has canceled by the connected account after being accepted */
  | 'CANCELLED'
  /** Offer has been delivered */
  | 'DELIVERED'
  /** Offer has expired */
  | 'EXPIRED'
  /** The offer had been repaid in full */
  | 'FULLY_REPAID'
  /** The offer has been paid out to the connected account */
  | 'PAID_OUT'
  /** Offer has been replaced by a new offer */
  | 'REPLACED'
  /** Offer has not been delivered to the connected account */
  | 'UNDELIVERED';

/** A cash app payment applied to a quote or invoice */
export type CashAppPaymentRecord = PaymentRecordInterface & {
  __typename?: 'CashAppPaymentRecord';
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance (absolute value) */
  amount: Scalars['Float']['output'];
  /** Whether the payment can be edited */
  canEdit: Scalars['Boolean']['output'];
  /** The client associated with the payment */
  client?: Maybe<Client>;
  /** The confirmation number of the Cash App payment */
  confirmationNumber?: Maybe<Scalars['String']['output']>;
  /** Additional details about the payment */
  details?: Maybe<Scalars['String']['output']>;
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The invoice associated with the payment */
  invoice?: Maybe<Invoice>;
  /** Where the payment originated from */
  paymentOrigin?: Maybe<PaymentOrigin>;
  /** The type of payment used, i.e cash, check, Jobber Payments... */
  paymentType?: Maybe<PaymentType>;
  /** The quote associated with the deposit payment */
  quote?: Maybe<Quote>;
  /** The raw amount applied against the quote or invoice balance (preserves sign). */
  rawAmount: Scalars['Float']['output'];
  /** Refunds associated with the payment */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** If sent, the DateTime the payment record was sent to client. */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};


/** A cash app payment applied to a quote or invoice */
export type CashAppPaymentRecordAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A cash app payment applied to a quote or invoice */
export type CashAppPaymentRecordRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** A cash payment applied to a quote or invoice */
export type CashPaymentRecord = PaymentRecordInterface & {
  __typename?: 'CashPaymentRecord';
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance (absolute value) */
  amount: Scalars['Float']['output'];
  /** Whether the payment can be edited */
  canEdit: Scalars['Boolean']['output'];
  /** The client associated with the payment */
  client?: Maybe<Client>;
  /** Additional details about the payment */
  details?: Maybe<Scalars['String']['output']>;
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The invoice associated with the payment */
  invoice?: Maybe<Invoice>;
  /** Where the payment originated from */
  paymentOrigin?: Maybe<PaymentOrigin>;
  /** The type of payment used, i.e cash, check, Jobber Payments... */
  paymentType?: Maybe<PaymentType>;
  /** The quote associated with the deposit payment */
  quote?: Maybe<Quote>;
  /** The raw amount applied against the quote or invoice balance (preserves sign). */
  rawAmount: Scalars['Float']['output'];
  /** Refunds associated with the payment */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** If sent, the DateTime the payment record was sent to client. */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};


/** A cash payment applied to a quote or invoice */
export type CashPaymentRecordAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A cash payment applied to a quote or invoice */
export type CashPaymentRecordRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** A check payment applied to a quote or invoice */
export type CheckPaymentRecord = PaymentRecordInterface & {
  __typename?: 'CheckPaymentRecord';
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance (absolute value) */
  amount: Scalars['Float']['output'];
  /** Whether the payment can be edited */
  canEdit: Scalars['Boolean']['output'];
  /** The check number used for payment */
  checkNumber?: Maybe<Scalars['String']['output']>;
  /** The client associated with the payment */
  client?: Maybe<Client>;
  /** Additional details about the payment */
  details?: Maybe<Scalars['String']['output']>;
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The invoice associated with the payment */
  invoice?: Maybe<Invoice>;
  /** Where the payment originated from */
  paymentOrigin?: Maybe<PaymentOrigin>;
  /** The type of payment used, i.e cash, check, Jobber Payments... */
  paymentType?: Maybe<PaymentType>;
  /** The quote associated with the deposit payment */
  quote?: Maybe<Quote>;
  /** The raw amount applied against the quote or invoice balance (preserves sign). */
  rawAmount: Scalars['Float']['output'];
  /** Refunds associated with the payment */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** If sent, the DateTime the payment record was sent to client. */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};


/** A check payment applied to a quote or invoice */
export type CheckPaymentRecordAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A check payment applied to a quote or invoice */
export type CheckPaymentRecordRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type Client = CustomFieldsInterface & {
  __typename?: 'Client';
  /** The client's current balance */
  balance: Scalars['Float']['output'];
  /** The billing address of the client */
  billingAddress?: Maybe<ClientAddress>;
  /** Is a custom billing address present for this client? */
  billingAddressPresent: Scalars['Boolean']['output'];
  /** The properties belonging to the client which are serviced by the service provider */
  clientProperties: PropertyConnection;
  /** The name of the business */
  companyName?: Maybe<Scalars['String']['output']>;
  /** The contacts associated with the client */
  contacts: ContactModelConnection;
  /** The time the client was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The custom fields set for this object */
  customFields: Array<CustomFieldUnion>;
  /** The email address stored from previous communications. */
  defaultEmails: Array<Scalars['String']['output']>;
  /** Default phone numbers to fetch for the given message type. */
  defaultPhones: Array<Scalars['String']['output']>;
  /** The client's primary email address */
  email?: Maybe<Scalars['String']['output']>;
  /** The email addresses belonging to the client */
  emails: Array<Email>;
  /** The first name of the client */
  firstName: Scalars['String']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The invoices associated with the client */
  invoices: InvoiceConnection;
  /** Is the client archivable */
  isArchivable: Scalars['Boolean']['output'];
  /** Is the client archived */
  isArchived: Scalars['Boolean']['output'];
  /** Does the client represent a business */
  isCompany: Scalars['Boolean']['output'];
  /** The status of the client; represents whether the client is a prospective lead */
  isLead: Scalars['Boolean']['output'];
  /** The URI for the given record in Jobber Online */
  jobberWebUri: Scalars['String']['output'];
  /** The jobs associated with the client */
  jobs: JobConnection;
  /** The last name of the client */
  lastName: Scalars['String']['output'];
  /** All messages for the client ordered by date descending. */
  messages: MessageInterfaceConnection;
  /** The primary name of the client */
  name: Scalars['String']['output'];
  /** The note files attached to the client */
  noteAttachments: ClientNoteFileConnection;
  /** The notes attached to the client */
  notes: ClientNoteConnection;
  /** The client's primary phone number */
  phone?: Maybe<Scalars['String']['output']>;
  /** The phone numbers belonging to the client */
  phones: Array<ClientPhoneNumber>;
  /**
   * The properties belonging to the client which are serviced by the service provider
   * @deprecated Favoring connection types, use `clientProperties`. Once confident all users have migrated, this field will become a connection type.
   */
  properties: Array<Property>;
  /** The quotes associated with the client */
  quotes: QuoteConnection;
  /** Does the client receive job follow ups */
  receivesFollowUps: Scalars['Boolean']['output'];
  /** Does the client receive invoice follow ups */
  receivesInvoiceFollowUps: Scalars['Boolean']['output'];
  /** Does the client receive quote follow ups */
  receivesQuoteFollowUps: Scalars['Boolean']['output'];
  /** Does the client receive assessment or visit reminders */
  receivesReminders: Scalars['Boolean']['output'];
  /** Does the client receive review requests */
  receivesReviewRequests: Scalars['Boolean']['output'];
  /** The client's requests, quotes, jobs, invoices, and treatments, defaulting to descending modified date order */
  requestedWorkObjects?: Maybe<RequestedWorkObjectUnionConnection>;
  /** The requests associated with the client */
  requests: RequestConnection;
  /** Is the client sample data */
  sampleData: Scalars['Boolean']['output'];
  /** All scheduled items associated with the client, including both scheduled and unscheduled appointments */
  scheduledItems: ScheduledItemInterfaceConnection;
  /** The secondary name of the client */
  secondaryName?: Maybe<Scalars['String']['output']>;
  /** The source of the client object */
  sourceAttribution?: Maybe<SourceAttribution>;
  /** The custom tags added to the client */
  tags: TagConnection;
  /** The title of the client */
  title?: Maybe<Scalars['String']['output']>;
  /** The deposit records that haven't been applied to an invoice and have not been refunded */
  unallocatedDepositRecords: PaymentRecordInterfaceConnection;
  /** The last time the client was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /**
   * The client's requests, quotes, jobs, and invoices sorted descending by modified date
   * @deprecated deprecated, use requested_work_objects
   */
  workObjects?: Maybe<WorkObjectUnionConnection>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientClientPropertiesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientContactsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ContactFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<ContactsSortInput>>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientDefaultEmailsArgs = {
  emailType?: InputMaybe<EmailTypes>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientDefaultPhonesArgs = {
  messageType?: InputMaybe<WorkObjectSendMessageType>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientEmailsArgs = {
  filter?: InputMaybe<EmailFilterInput>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientInvoicesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientJobsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<JobFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<JobsSortInput>>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientMessagesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientNoteAttachmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<NoteAttachmentFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<NoteAttachmentSortAttributes>>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientNotesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<NotesSortInput>>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientPhonesArgs = {
  filter?: InputMaybe<PhoneFilterInput>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientQuotesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientRequestedWorkObjectsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter: RequestedWorkObjectsFilterAttributes;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<RequestedWorkObjectsSortAttributes>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientRequestsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientScheduledItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ClientScheduledItemsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientTagsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientUnallocatedDepositRecordsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** Clients are the customers who pay for services on Jobber's platform - they belong to the Jobber account / service provider. */
export type ClientWorkObjectsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<WorkObjectsFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** Address for a client property or billing address */
export type ClientAddress = {
  __typename?: 'ClientAddress';
  /** The city for this address. */
  city: Scalars['String']['output'];
  /** The country of this address. */
  country: Scalars['String']['output'];
  /** The latitude of this address. */
  latitude: Scalars['String']['output'];
  /** The longitude of this address. */
  longitude: Scalars['String']['output'];
  /** The name of the property for the address */
  name?: Maybe<Scalars['String']['output']>;
  /** The zip or postal code of this address. */
  postalCode: Scalars['String']['output'];
  /** The state or province of this address. */
  province: Scalars['String']['output'];
  /** The street component */
  street: Scalars['String']['output'];
  /** The first line of the street address */
  street1: Scalars['String']['output'];
  /** The second line of the street address */
  street2: Scalars['String']['output'];
};

/** Attributes for updating a client address */
export type ClientAddressUpdateAttributes = {
  /** The city */
  city?: InputMaybe<Scalars['String']['input']>;
  /** The country */
  country?: InputMaybe<Scalars['String']['input']>;
  /** The latitude of this address */
  latitude?: InputMaybe<Scalars['Float']['input']>;
  /** The longitude of this address */
  longitude?: InputMaybe<Scalars['Float']['input']>;
  /** The Google place_id of this address */
  placeId?: InputMaybe<Scalars['String']['input']>;
  /** The zip or postal code */
  postalCode?: InputMaybe<Scalars['String']['input']>;
  /** The state or province */
  province?: InputMaybe<Scalars['String']['input']>;
  /** The first line of the street address */
  street1?: InputMaybe<Scalars['String']['input']>;
  /** The second line of the street address */
  street2?: InputMaybe<Scalars['String']['input']>;
};

/** Autogenerated return type of ClientArchive. */
export type ClientArchivePayload = {
  __typename?: 'ClientArchivePayload';
  /** The archived client */
  client?: Maybe<Client>;
  /** Errors encountered when archiving the client */
  userErrors: Array<MutationErrors>;
};

/** The connection type for Client. */
export type ClientConnection = {
  __typename?: 'ClientConnection';
  /** A list of edges. */
  edges?: Maybe<Array<ClientEdge>>;
  /** A list of nodes. */
  nodes: Array<Client>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** Association counts for a client */
export type ClientCounts = {
  __typename?: 'ClientCounts';
  /** The number of deposits associated with the client */
  deposits?: Maybe<Scalars['Int']['output']>;
  /** The number of invoices associated with the client */
  invoices?: Maybe<Scalars['Int']['output']>;
  /** The number of jobs associated with the client */
  jobs?: Maybe<Scalars['Int']['output']>;
  /** The number of notes associated with the client */
  notes?: Maybe<Scalars['Int']['output']>;
  /** The number of payments associated with the client */
  payments?: Maybe<Scalars['Int']['output']>;
  /** The number of properties associated with the client */
  properties?: Maybe<Scalars['Int']['output']>;
  /** The number of quotes associated with the client */
  quotes?: Maybe<Scalars['Int']['output']>;
  /** The number of requests associated with the client */
  requests?: Maybe<Scalars['Int']['output']>;
  /** The number of tasks associated with the client */
  tasks?: Maybe<Scalars['Int']['output']>;
  /** The number of visits associated with the client */
  visits?: Maybe<Scalars['Int']['output']>;
};

/** Attributes for creating a new client */
export type ClientCreateInput = {
  /** The client's billing address */
  billingAddress?: InputMaybe<AddressAttributes>;
  /** The company name of the client */
  companyName?: InputMaybe<Scalars['String']['input']>;
  /** List of contacts to add to the client */
  contacts?: InputMaybe<Array<ContactCreateAttributes>>;
  /** The client's custom fields */
  customFields?: InputMaybe<Array<CustomFieldCreateInput>>;
  /** The client's email addresses */
  emails?: InputMaybe<Array<EmailCreateAttributes>>;
  /** The first name of the client */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** Use company name as the primary name of the client */
  isCompany?: InputMaybe<Scalars['Boolean']['input']>;
  /** The last name of the client */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** The client's phone numbers */
  phones?: InputMaybe<Array<PhoneNumberCreateAttributes>>;
  /** The client's properties */
  properties?: InputMaybe<Array<PropertyAttributes>>;
  /** Does the client receive job follow ups */
  receivesFollowUps?: InputMaybe<Scalars['Boolean']['input']>;
  /** Does the client receive invoice follow ups */
  receivesInvoiceFollowUps?: InputMaybe<Scalars['Boolean']['input']>;
  /** Does the client receive quote follow ups */
  receivesQuoteFollowUps?: InputMaybe<Scalars['Boolean']['input']>;
  /** Does the client receive assessment or visit reminders */
  receivesReminders?: InputMaybe<Scalars['Boolean']['input']>;
  /** Does the client receive review requests */
  receivesReviewRequests?: InputMaybe<Scalars['Boolean']['input']>;
  /** The source of the client object */
  sourceAttribution?: InputMaybe<SourceAttributionAttributes>;
  /** The title of the client */
  title?: InputMaybe<ClientTitle>;
};

/** Attributes for creating client notes */
export type ClientCreateNoteInput = {
  /** List of attachments to be added to the note */
  attachments?: InputMaybe<Array<NoteAttachmentAttributes>>;
  /** Which objects this client note should be linked to */
  linkedTo?: InputMaybe<ClientNoteLinkInput>;
  /** The message to be placed on the note */
  message?: InputMaybe<Scalars['String']['input']>;
  /** Whether the note should be pinned */
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Autogenerated return type of ClientCreateNote. */
export type ClientCreateNotePayload = {
  __typename?: 'ClientCreateNotePayload';
  /** The client the note is attached to */
  client?: Maybe<Client>;
  /** The newly created note */
  clientNote?: Maybe<ClientNote>;
  /** Errors encountered during note creation */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of ClientCreate. */
export type ClientCreatePayload = {
  __typename?: 'ClientCreatePayload';
  /** The created client */
  client?: Maybe<Client>;
  /** Errors encountered when creating the client */
  userErrors: Array<MutationErrors>;
};

/** Attributes for deleting an existing client note */
export type ClientDeleteNoteInput = {
  /** The unique identifier of the note */
  noteId: Scalars['EncodedId']['input'];
};

/** Autogenerated return type of ClientDeleteNote. */
export type ClientDeleteNotePayload = {
  __typename?: 'ClientDeleteNotePayload';
  /** The client the note is attached to */
  client?: Maybe<Client>;
  /** The deleted note */
  deletedNote?: Maybe<ClientNote>;
  /** Errors encountered during note edit */
  userErrors: Array<MutationErrors>;
};

/** An edge in a connection. */
export type ClientEdge = {
  __typename?: 'ClientEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Client;
};

/** Attributes for updating a client */
export type ClientEditInput = {
  /** The client's billing address */
  billingAddress?: InputMaybe<AddressAttributes>;
  /** The company name of the client */
  companyName?: InputMaybe<Scalars['String']['input']>;
  /** List of contacts to append to the client */
  contactsToAdd?: InputMaybe<Array<ContactCreateAttributes>>;
  /** List of contacts to delete */
  contactsToDelete?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** List of contacts to update */
  contactsToEdit?: InputMaybe<Array<ContactEditAttributes>>;
  /** The client's custom fields */
  customFields?: InputMaybe<Array<CustomFieldEditInput>>;
  /** List of emails to append to the client's email addresses */
  emailsToAdd?: InputMaybe<Array<EmailCreateAttributes>>;
  /** List of emails to delete from the client */
  emailsToDelete?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** List of emails to be updated */
  emailsToEdit?: InputMaybe<Array<EmailUpdateAttributes>>;
  /** The first name of the client */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** Use company name as the primary name of the client */
  isCompany?: InputMaybe<Scalars['Boolean']['input']>;
  /** The last name of the client */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** List of phone numbers to append to the client's phones */
  phonesToAdd?: InputMaybe<Array<PhoneNumberCreateAttributes>>;
  /** List of phone numbers to delete from the client's phones */
  phonesToDelete?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** List of phone numbers to be updated */
  phonesToEdit?: InputMaybe<Array<PhoneNumberUpdateAttributes>>;
  /** The client's properties to add */
  propertiesToAdd?: InputMaybe<Array<PropertyAttributes>>;
  /** The client's properties to delete */
  propertiesToDelete?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** The client's properties to update */
  propertiesToEdit?: InputMaybe<Array<PropertyEditAttributes>>;
  /** Does the client receive job follow ups */
  receivesFollowUps?: InputMaybe<Scalars['Boolean']['input']>;
  /** Does the client receive invoice follow ups */
  receivesInvoiceFollowUps?: InputMaybe<Scalars['Boolean']['input']>;
  /** Does the client receive quote follow ups */
  receivesQuoteFollowUps?: InputMaybe<Scalars['Boolean']['input']>;
  /** Does the client receive assessment or visit reminders */
  receivesReminders?: InputMaybe<Scalars['Boolean']['input']>;
  /** Does the client receive review requests */
  receivesReviewRequests?: InputMaybe<Scalars['Boolean']['input']>;
  /** List of tags to append to the client's tags */
  tagsToAdd?: InputMaybe<Array<Scalars['String']['input']>>;
  /** List of tags to delete from the client's tags */
  tagsToDelete?: InputMaybe<Array<Scalars['String']['input']>>;
  /** The title of the client */
  title?: InputMaybe<ClientTitle>;
};

/** Attributes for editing an existing client note */
export type ClientEditNoteInput = {
  /** List of attachments to append to the note */
  attachmentsToAdd?: InputMaybe<Array<NoteAttachmentAttributes>>;
  /** List of attachments to delete from the note */
  attachmentsToDelete?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** Which objects this note should be linked to */
  linkedTo?: InputMaybe<ClientNoteLinkInput>;
  /** The new message to place on the note */
  message?: InputMaybe<Scalars['String']['input']>;
  /** The unique identifier of the note */
  noteId: Scalars['EncodedId']['input'];
  /** Whether the note should be pinned */
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Autogenerated return type of ClientEditNote. */
export type ClientEditNotePayload = {
  __typename?: 'ClientEditNotePayload';
  /** The client the note is attached to */
  client?: Maybe<Client>;
  /** The edited note */
  clientNote?: Maybe<ClientNote>;
  /** Errors encountered during note edit */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of ClientEdit. */
export type ClientEditPayload = {
  __typename?: 'ClientEditPayload';
  /** The modified client */
  client?: Maybe<Client>;
  /** Errors encountered when modifying the client */
  userErrors: Array<MutationErrors>;
};

/** Attributes for filtering clients */
export type ClientFilterAttributes = {
  /** The client created at date to filter by */
  createdAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** Whether or not the client is archived */
  isArchived?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether or not the client is a company */
  isCompany?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether or not the client is a lead */
  isLead?: InputMaybe<Scalars['Boolean']['input']>;
  /** The client tags to filter by */
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  /** The client updated at date to filter by */
  updatedAt?: InputMaybe<Iso8601DateTimeRangeInput>;
};

/** Metadata for a client */
export type ClientMeta = {
  __typename?: 'ClientMeta';
  /** Whether the client has a client hub enabled */
  clientHub?: Maybe<Scalars['Boolean']['output']>;
  /** Association counts for the client */
  counts?: Maybe<ClientCounts>;
};

/** A client note */
export type ClientNote = NoteInterface & {
  __typename?: 'ClientNote';
  /** When the note was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The user or app that created the note */
  createdBy?: Maybe<NoteCreatedByUnion>;
  /** The attached note files */
  fileAttachments: NoteFileInterfaceConnection;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** When the note was last updated by a user */
  lastEditedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The last user to edit the note */
  lastEditedBy?: Maybe<User>;
  /** What objects (client, quote, job, etc.) the note is linked to */
  linkedTo: NoteLink;
  /** The note message */
  message: Scalars['String']['output'];
  /** Whether the note is pinned */
  pinned: Scalars['Boolean']['output'];
};


/** A client note */
export type ClientNoteFileAttachmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<NoteAttachmentFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<NoteAttachmentSortAttributes>>;
};

/** Autogenerated return type of ClientNoteAddAttachment. */
export type ClientNoteAddAttachmentPayload = {
  __typename?: 'ClientNoteAddAttachmentPayload';
  /** The URLs of the newly added attachments which are being processed */
  attachmentsToBeAdded?: Maybe<Array<Scalars['String']['output']>>;
  /** Errors when appending the attachments to the note */
  userErrors: Array<MutationErrors>;
};

/** The connection type for ClientNote. */
export type ClientNoteConnection = {
  __typename?: 'ClientNoteConnection';
  /** A list of edges. */
  edges?: Maybe<Array<ClientNoteEdge>>;
  /** A list of nodes. */
  nodes: Array<ClientNote>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type ClientNoteEdge = {
  __typename?: 'ClientNoteEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: ClientNote;
};

/** A file attached to a note */
export type ClientNoteFile = NoteFileInterface & {
  __typename?: 'ClientNoteFile';
  /** The type of the file */
  contentType: Scalars['String']['output'];
  /** The time the note file attachment was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The name of the file */
  fileName: Scalars['String']['output'];
  /** The size of the file in bytes */
  fileSize: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The note this attachment is attached to */
  note: ClientNote;
  /** The possible statuses for the file */
  status: NoteFileStatusEnum;
  /** The location of the thumbnail */
  thumbnailUrl: Scalars['String']['output'];
  /** The time the note file attachment was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** The location of the file */
  url: Scalars['String']['output'];
};

/** The connection type for ClientNoteFile. */
export type ClientNoteFileConnection = {
  __typename?: 'ClientNoteFileConnection';
  /** A list of edges. */
  edges?: Maybe<Array<ClientNoteFileEdge>>;
  /** A list of nodes. */
  nodes: Array<ClientNoteFile>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type ClientNoteFileEdge = {
  __typename?: 'ClientNoteFileEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: ClientNoteFile;
};

/** Attributes for linking client notes */
export type ClientNoteLinkInput = {
  /** Whether the note should be linked to related invoices */
  invoices?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether the note should be linked to related jobs */
  jobs?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether the note should be linked to related quotes */
  quotes?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether the note should be linked to related requests */
  requests?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Attributes for filtering client phones */
export type ClientPhoneFilterAttributes = {
  /** Filter down to just numbers that are valid and can receive SMS */
  isValidSmsPhoneNumber?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether or not the number is SMS enabled */
  smsAllowed?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether or not the number has requested to receive no more messages */
  smsStopped?: InputMaybe<Scalars['Boolean']['input']>;
};

/** A client phone number */
export type ClientPhoneNumber = {
  __typename?: 'ClientPhoneNumber';
  /** The client attached to this phone */
  client: Client;
  /** The contact attached to this phone number */
  contact?: Maybe<ContactModel>;
  /** The phone type (eg Main, Mobile, etc) */
  description: Scalars['String']['output'];
  /** A user friendly representation of the phone number */
  friendly: Scalars['String']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The normalized phone number in the e164 format */
  normalizedPhoneNumber?: Maybe<Scalars['String']['output']>;
  /** The phone number as stored. */
  number: Scalars['String']['output'];
  /** Is the phone number a primary number? */
  primary: Scalars['Boolean']['output'];
  /** Can the phone number receive text messages? */
  smsAllowed: Scalars['Boolean']['output'];
};

/** The connection type for ClientPhoneNumber. */
export type ClientPhoneNumberConnection = {
  __typename?: 'ClientPhoneNumberConnection';
  /** A list of edges. */
  edges?: Maybe<Array<ClientPhoneNumberEdge>>;
  /** A list of nodes. */
  nodes: Array<ClientPhoneNumber>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type ClientPhoneNumberEdge = {
  __typename?: 'ClientPhoneNumberEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: ClientPhoneNumber;
};

/** Attributes for filtering scheduled items on a client */
export type ClientScheduledItemsFilter = {
  /** The type of scheduled item to filter by */
  scheduleItemType?: InputMaybe<ScheduledItemType>;
};

/** Fields that can be included in a client search */
export type ClientSearchField =
  /** Include client custom field values in search */
  | 'CUSTOM_FIELDS'
  /** Include client email addresses in search */
  | 'EMAILS'
  /** Include client names (first_name, last_name, company_name) in search */
  | 'NAMES'
  /** Include client notes in search */
  | 'NOTES'
  /** Include client phone numbers in search */
  | 'PHONES'
  /** Include primary email address in search */
  | 'PRIMARY_EMAIL'
  /** Include client property addresses in search */
  | 'PROPERTIES';

export type ClientTitle =
  /** The client is addressed as Dr. */
  | 'DR'
  /** The client is addressed as Miss */
  | 'MISS'
  /** The client is addressed as Mr. */
  | 'MR'
  /** The client is addressed as Mrs. */
  | 'MRS'
  /** The client is addressed as Ms. */
  | 'MS';

/** Autogenerated return type of ClientUnarchive. */
export type ClientUnarchivePayload = {
  __typename?: 'ClientUnarchivePayload';
  /** The unarchived client */
  client?: Maybe<Client>;
  /** Errors encountered when unarchiving the client */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of ClientsCreate. */
export type ClientsCreatePayload = {
  __typename?: 'ClientsCreatePayload';
  /** The created client(s) */
  clients?: Maybe<ClientConnection>;
  /** Errors encountered when creating the client(s) */
  userErrors: Array<MutationErrors>;
};


/** Autogenerated return type of ClientsCreate. */
export type ClientsCreatePayloadClientsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** The attributes to sort on a collection of Clients */
export type ClientsSortInput = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The key to sort on */
  key: ClientsSortKey;
};

/** The fields, or associated fields, on a collection of Clients which support sorting functionality */
export type ClientsSortKey =
  /** The field which indicates the first name of the Client */
  | 'FIRST_NAME'
  /** The field which indicates the last name of the Client */
  | 'LAST_NAME'
  /** The field which indicates the primary name of the Client */
  | 'PRIMARY_NAME'
  /** The field which indicates when the Client was last updated at */
  | 'UPDATED_AT';

/** Attributes for creating a new contact */
export type ContactCreateAttributes = {
  /** Whether this contact can access client hub */
  canAccessClientHub?: InputMaybe<Scalars['Boolean']['input']>;
  /** List of emails to append to the client's email addresses */
  emails?: InputMaybe<Array<EmailCreateAttributes>>;
  /** The first name of the contact */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** Whether this contact is responsible for billing */
  isBillingContact?: InputMaybe<Scalars['Boolean']['input']>;
  /** The last name of the contact */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** List of phone numbers to append to the client's phones */
  phones?: InputMaybe<Array<PhoneNumberCreateAttributes>>;
  /** List of property IDs to associate the contact with. If omitted or empty, the contact is a client-level contact visible on all properties. */
  propertyIds?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** Whether this contact receives job follow ups */
  receivesFollowUps?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether this contact receives invoice follow ups */
  receivesInvoiceFollowUps?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether this contact receives quote follow ups */
  receivesQuoteFollowUps?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether this contact receives assessment or visit reminders */
  receivesReminders?: InputMaybe<Scalars['Boolean']['input']>;
  /** The role of the contact */
  role?: InputMaybe<Scalars['String']['input']>;
  /** The title of the contact */
  title?: InputMaybe<ClientTitle>;
};

/** Attributes for editing a contact */
export type ContactEditAttributes = {
  /** Whether this contact can access client hub */
  canAccessClientHub?: InputMaybe<Scalars['Boolean']['input']>;
  /** The city */
  city?: InputMaybe<Scalars['String']['input']>;
  /** The country */
  country?: InputMaybe<Scalars['String']['input']>;
  /** List of emails to append to the client's email addresses */
  emailsToAdd?: InputMaybe<Array<EmailCreateAttributes>>;
  /** List of emails to delete from the client */
  emailsToDelete?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** List of emails to be updated */
  emailsToEdit?: InputMaybe<Array<EmailUpdateAttributes>>;
  /** The first name of the contact */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** The ID of the contact */
  id: Scalars['EncodedId']['input'];
  /** Whether this contact is responsible for billing */
  isBillingContact?: InputMaybe<Scalars['Boolean']['input']>;
  /** The last name of the contact */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** The latitude of this address */
  latitude?: InputMaybe<Scalars['Float']['input']>;
  /** The longitude of this address */
  longitude?: InputMaybe<Scalars['Float']['input']>;
  /** List of phone numbers to append to the client's phones */
  phonesToAdd?: InputMaybe<Array<PhoneNumberCreateAttributes>>;
  /** List of phone numbers to delete from the client's phones */
  phonesToDelete?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** List of phone numbers to be updated */
  phonesToEdit?: InputMaybe<Array<PhoneNumberUpdateAttributes>>;
  /** The Google place_id of this address */
  placeId?: InputMaybe<Scalars['String']['input']>;
  /** The zip or postal code */
  postalCode?: InputMaybe<Scalars['String']['input']>;
  /** List of property IDs the contact should be associated with. Replaces all existing property associations. An empty list or null makes the contact a client-level contact visible on all properties. Omit this field entirely to leave property associations unchanged. */
  propertyIds?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** The state or province */
  province?: InputMaybe<Scalars['String']['input']>;
  /** Whether this contact receives job follow ups */
  receivesFollowUps?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether this contact receives invoice follow ups */
  receivesInvoiceFollowUps?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether this contact receives quote follow ups */
  receivesQuoteFollowUps?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether this contact receives assessment or visit reminders */
  receivesReminders?: InputMaybe<Scalars['Boolean']['input']>;
  /** The role of the contact */
  role?: InputMaybe<Scalars['String']['input']>;
  /** The first line of the street address */
  street1?: InputMaybe<Scalars['String']['input']>;
  /** The second line of the street address */
  street2?: InputMaybe<Scalars['String']['input']>;
  /** The title of the contact */
  title?: InputMaybe<ClientTitle>;
};

/** Attributes for filtering contacts */
export type ContactFilterInput = {
  /** If true, returns both client and property level contacts. */
  includePropertyContacts?: InputMaybe<Scalars['Boolean']['input']>;
};

/** A contact associated with a client that can receive communications */
export type ContactModel = {
  __typename?: 'ContactModel';
  /** Whether this contact can access client hub */
  canAccessClientHub: Scalars['Boolean']['output'];
  /** When the contact was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The email addresses belonging to the contact */
  emails: EmailConnection;
  /** The first name of the contact */
  firstName?: Maybe<Scalars['String']['output']>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** Whether this contact is responsible for billing */
  isBillingContact: Scalars['Boolean']['output'];
  /** The last name of the contact */
  lastName?: Maybe<Scalars['String']['output']>;
  /** The name of the contact */
  name?: Maybe<Scalars['String']['output']>;
  /** The phone numbers belonging to the contact */
  phones: ClientPhoneNumberConnection;
  /** The properties belonging to the contact */
  properties: PropertyConnection;
  /** Whether this contact receives job follow ups */
  receivesFollowUps: Scalars['Boolean']['output'];
  /** Whether this contact receives invoice follow ups */
  receivesInvoiceFollowUps: Scalars['Boolean']['output'];
  /** Whether this contact receives quote follow ups */
  receivesQuoteFollowUps: Scalars['Boolean']['output'];
  /** Whether this contact receives assessment or visit reminders */
  receivesReminders: Scalars['Boolean']['output'];
  /** The role of the contact */
  role?: Maybe<Scalars['String']['output']>;
  /** The title of the contact */
  title?: Maybe<Scalars['String']['output']>;
  /** When the contact was last updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
};


/** A contact associated with a client that can receive communications */
export type ContactModelEmailsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A contact associated with a client that can receive communications */
export type ContactModelPhonesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A contact associated with a client that can receive communications */
export type ContactModelPropertiesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** The connection type for ContactModel. */
export type ContactModelConnection = {
  __typename?: 'ContactModelConnection';
  /** A list of edges. */
  edges?: Maybe<Array<ContactModelEdge>>;
  /** A list of nodes. */
  nodes: Array<ContactModel>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type ContactModelEdge = {
  __typename?: 'ContactModelEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: ContactModel;
};

/** The attributes to sort on a collection of Contacts */
export type ContactsSortInput = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The key to sort on */
  key: ContactsSortKey;
};

/** The fields, or associated fields, on a collection of Contacts which support sorting functionality */
export type ContactsSortKey =
  /** The field which indicates the first name of the Contact */
  | 'FIRST_NAME'
  /** The field which indicates the last name of the Contact */
  | 'LAST_NAME'
  /** The field which indicates when the Contact was last updated at */
  | 'UPDATED_AT';

/** Used to define a modifier on a cost amount (i.e. a deposit or discount) that can be either a fixed amount or a percentage amount */
export type CostModifierAttributes = {
  /** The value of the cost modifier */
  rate: Scalars['Float']['input'];
  /** The way to apply the cost modifier */
  type: CostModifierTypeEnum;
};

export type CostModifierTypeEnum =
  /** The cost modifier applies a percentage of the initial value */
  | 'Percent'
  /** The cost modifier applies a fixed amount to the initial value */
  | 'Unit';

/** Autogenerated return type of Create. */
export type CreatePayload = {
  __typename?: 'CreatePayload';
  /** The newly created product or service */
  productOrService?: Maybe<ProductOrService>;
  /** Errors encountered when creating the product or service */
  userErrors: Array<MutationErrors>;
};

/** A credit or debit card payment applied to a quote or invoice */
export type CreditCardPaymentRecord = PaymentRecordInterface & {
  __typename?: 'CreditCardPaymentRecord';
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance (absolute value) */
  amount: Scalars['Float']['output'];
  /** Whether the payment can be edited */
  canEdit: Scalars['Boolean']['output'];
  /** The transaction number of the credit or debit card payment */
  ccTransactionNumber?: Maybe<Scalars['String']['output']>;
  /** The client associated with the payment */
  client?: Maybe<Client>;
  /** Additional details about the payment */
  details?: Maybe<Scalars['String']['output']>;
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The invoice associated with the payment */
  invoice?: Maybe<Invoice>;
  /** Where the payment originated from */
  paymentOrigin?: Maybe<PaymentOrigin>;
  /** The type of payment used, i.e cash, check, Jobber Payments... */
  paymentType?: Maybe<PaymentType>;
  /** The quote associated with the deposit payment */
  quote?: Maybe<Quote>;
  /** The raw amount applied against the quote or invoice balance (preserves sign). */
  rawAmount: Scalars['Float']['output'];
  /** Refunds associated with the payment */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** If sent, the DateTime the payment record was sent to client. */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};


/** A credit or debit card payment applied to a quote or invoice */
export type CreditCardPaymentRecordAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A credit or debit card payment applied to a quote or invoice */
export type CreditCardPaymentRecordRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type CustomFieldAppliesTo =
  /** Attach custom field to all clients on account */
  | 'ALL_CLIENTS'
  /** Attach custom field to all invoices on account */
  | 'ALL_INVOICES'
  /** Attach custom field to all jobs on account */
  | 'ALL_JOBS'
  /** Attach custom field to all product or services on account */
  | 'ALL_PRODUCTS_AND_SERVICES'
  /** Attach custom field to all properties on account */
  | 'ALL_PROPERTIES'
  /** Attach custom field to all quotes on account */
  | 'ALL_QUOTES'
  /** Attach custom field to a team */
  | 'TEAM';

/**
 * The Area Custom Field Types.
 * Example query:
 * ```
 * {
 *   ... on CustomFieldAreaType {
 *     id
 *     label
 *     unit
 *     valueArea {
 *       length
 *       width
 *     }
 *   }
 * }
 * ```
 *
 */
export type CustomFieldArea = {
  __typename?: 'CustomFieldArea';
  /** The area custom field configuration for this value. */
  customFieldConfiguration: CustomFieldConfigurationArea;
  /** The ID of this custom field. */
  id?: Maybe<Scalars['EncodedId']['output']>;
  /** The label to display for this field. */
  label: Scalars['String']['output'];
  /** The unit of this field. */
  unit: Scalars['String']['output'];
  /** The length and width of this field. */
  valueArea: CustomFieldAreaValue;
};

/** An area custom field */
export type CustomFieldAreaValue = {
  __typename?: 'CustomFieldAreaValue';
  /** The length value. */
  length: Scalars['Float']['output'];
  /** The width value. */
  width: Scalars['Float']['output'];
};

/** Custom Field Configuration Type */
export type CustomFieldConfiguration = CustomFieldConfigurationArea | CustomFieldConfigurationDropdown | CustomFieldConfigurationLink | CustomFieldConfigurationNumeric | CustomFieldConfigurationText | CustomFieldConfigurationTrueFalse;

/** Autogenerated return type of CustomFieldConfigurationArchive. */
export type CustomFieldConfigurationArchivePayload = {
  __typename?: 'CustomFieldConfigurationArchivePayload';
  /** The archived custom field configurations */
  customFieldConfigurations?: Maybe<Array<CustomFieldConfiguration>>;
  /** Errors if there are problems with configuring the custom field configuration */
  userErrors: Array<MutationErrors>;
};

/** An area custom field configuration */
export type CustomFieldConfigurationArea = CustomFieldConfigurationInterface & {
  __typename?: 'CustomFieldConfigurationArea';
  /** The object type to which the CustomFieldConfiguration belongs */
  appliesTo: CustomFieldAppliesTo;
  /** Indicates if the custom field is archived */
  archived: Scalars['Boolean']['output'];
  /** The time the CustomFieldConfiguration was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The default length and width for an area custom field */
  defaultValue: CustomFieldConfigurationAreaDefaultValue;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The name of the CustomFieldConfiguration */
  name: Scalars['String']['output'];
  /** Sets if Custom Field values are editable by Jobber users */
  readOnly: Scalars['Boolean']['output'];
  /** The order in which custom fields are displayed by default in Jobber */
  sortOrder: Scalars['Int']['output'];
  /** Transferable custom fields allow data to appear in multiple places and follow you through your workflow */
  transferable: Scalars['Boolean']['output'];
  /** custom field configuration that this field was transferred from */
  transferedFrom?: Maybe<CustomFieldConfiguration>;
  /** The unit of an area custom field */
  unit: Scalars['String']['output'];
  /** The last time the CustomFieldConfiguration was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** The number of work objects that currently have a value associated with this configuration */
  valueCount: ValueCount;
  /** The type of CustomFieldConfiguration */
  valueType: CustomFieldConfigurationValueType;
};

/** The default value for area custom fields */
export type CustomFieldConfigurationAreaDefaultValue = {
  __typename?: 'CustomFieldConfigurationAreaDefaultValue';
  /** The default length for area custom fields */
  length: Scalars['Float']['output'];
  /** The default width for area custom fields */
  width: Scalars['Float']['output'];
};

/** Default value input for an area custom field configuration */
export type CustomFieldConfigurationAreaDefaultValueInput = {
  /** The default length for area custom field configuration */
  length?: InputMaybe<Scalars['Float']['input']>;
  /** The default width for area custom field configuration */
  width?: InputMaybe<Scalars['Float']['input']>;
};

/** The connection type for CustomFieldConfiguration. */
export type CustomFieldConfigurationConnection = {
  __typename?: 'CustomFieldConfigurationConnection';
  /** A list of edges. */
  edges?: Maybe<Array<CustomFieldConfigurationEdge>>;
  /** A list of nodes. */
  nodes: Array<CustomFieldConfiguration>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** Input for creating a new area custom field configuration */
export type CustomFieldConfigurationCreateAreaInput = {
  /** What objects the custom field will be applied to */
  appliesTo: CustomFieldAppliesTo;
  /** The default values for an area custom field configuration */
  defaultValue?: InputMaybe<CustomFieldConfigurationAreaDefaultValueInput>;
  /** Name for the custom field */
  name: Scalars['String']['input'];
  /** Value of custom field is read-only */
  readOnly: Scalars['Boolean']['input'];
  /** Applies custom field to linked work objects */
  transferable: Scalars['Boolean']['input'];
  /** The unit for an area custom field configuration */
  unit: Scalars['String']['input'];
};

/** Autogenerated return type of CustomFieldConfigurationCreateArea. */
export type CustomFieldConfigurationCreateAreaPayload = {
  __typename?: 'CustomFieldConfigurationCreateAreaPayload';
  /** The configured area custom field configuration */
  customFieldConfiguration?: Maybe<CustomFieldConfigurationArea>;
  /** Errors if there are problems with configuring the area custom field configuration */
  userErrors: Array<MutationErrors>;
};

/** Input for creating a new dropdown custom field configuration */
export type CustomFieldConfigurationCreateDropdownInput = {
  /** What objects the custom field will be applied to */
  appliesTo: CustomFieldAppliesTo;
  /** The default value for a dropdown custom field configuration. If not supplied, first value of `dropdownOptions` will be used as the default */
  defaultValue?: InputMaybe<Scalars['String']['input']>;
  /** The default value for a dropdown custom field configuration */
  dropdownOptions: Array<Scalars['String']['input']>;
  /** Name for the custom field */
  name: Scalars['String']['input'];
  /** Value of custom field is read-only */
  readOnly: Scalars['Boolean']['input'];
  /** Applies custom field to linked work objects */
  transferable: Scalars['Boolean']['input'];
};

/** Autogenerated return type of CustomFieldConfigurationCreateDropdown. */
export type CustomFieldConfigurationCreateDropdownPayload = {
  __typename?: 'CustomFieldConfigurationCreateDropdownPayload';
  /** The configured dropdown custom field */
  customFieldConfiguration?: Maybe<CustomFieldConfigurationDropdown>;
  /** Errors if there are problems with configuring the dropdown custom field */
  userErrors: Array<MutationErrors>;
};

/** Input for creating a new link custom field configuration */
export type CustomFieldConfigurationCreateLinkInput = {
  /** What objects the custom field will be applied to */
  appliesTo: CustomFieldAppliesTo;
  /** The default value for link custom fields */
  defaultValue?: InputMaybe<CustomFieldConfigurationLinkDefaultValueInput>;
  /** Name for the custom field */
  name: Scalars['String']['input'];
  /** Value of custom field is read-only */
  readOnly: Scalars['Boolean']['input'];
  /** Applies custom field to linked work objects */
  transferable: Scalars['Boolean']['input'];
};

/** Autogenerated return type of CustomFieldConfigurationCreateLink. */
export type CustomFieldConfigurationCreateLinkPayload = {
  __typename?: 'CustomFieldConfigurationCreateLinkPayload';
  /** The configured link custom field configuration */
  customFieldConfiguration?: Maybe<CustomFieldConfigurationLink>;
  /** Errors if there are problems with configuring the link custom field. */
  userErrors: Array<MutationErrors>;
};

/** Input for creating a new numeric custom field configuration */
export type CustomFieldConfigurationCreateNumericInput = {
  /** What objects the custom field will be applied to */
  appliesTo: CustomFieldAppliesTo;
  /** The default value for a numeric custom field configuration */
  defaultValue?: InputMaybe<Scalars['Float']['input']>;
  /** Name for the custom field */
  name: Scalars['String']['input'];
  /** Value of custom field is read-only */
  readOnly: Scalars['Boolean']['input'];
  /** Applies custom field to linked work objects */
  transferable: Scalars['Boolean']['input'];
  /** The unit for a numeric custom field configuration */
  unit: Scalars['String']['input'];
};

/** Autogenerated return type of CustomFieldConfigurationCreateNumeric. */
export type CustomFieldConfigurationCreateNumericPayload = {
  __typename?: 'CustomFieldConfigurationCreateNumericPayload';
  /** The configured numeric custom field configuration */
  customFieldConfiguration?: Maybe<CustomFieldConfigurationNumeric>;
  /** Errors if there are problems with configuring the numeric custom field configuration */
  userErrors: Array<MutationErrors>;
};

/** Input for creating a new text custom field configuration */
export type CustomFieldConfigurationCreateTextInput = {
  /** What objects the custom field will be applied to */
  appliesTo: CustomFieldAppliesTo;
  /** The default value for a text custom field */
  defaultValue?: InputMaybe<Scalars['String']['input']>;
  /** Name for the custom field */
  name: Scalars['String']['input'];
  /** Value of custom field is read-only */
  readOnly: Scalars['Boolean']['input'];
  /** Applies custom field to linked work objects */
  transferable: Scalars['Boolean']['input'];
};

/** Autogenerated return type of CustomFieldConfigurationCreateText. */
export type CustomFieldConfigurationCreateTextPayload = {
  __typename?: 'CustomFieldConfigurationCreateTextPayload';
  /** The configured text custom field configuration */
  customFieldConfiguration?: Maybe<CustomFieldConfigurationText>;
  /** Errors if there are problems with configuring the text custom field configuration */
  userErrors: Array<MutationErrors>;
};

/** Input for creating a new True False custom field configuration */
export type CustomFieldConfigurationCreateTrueFalseInput = {
  /** What objects the custom field will be applied to */
  appliesTo: CustomFieldAppliesTo;
  /** The default value for a True False custom field */
  defaultValue: Scalars['Boolean']['input'];
  /** Name for the custom field */
  name: Scalars['String']['input'];
  /** Value of custom field is read-only */
  readOnly: Scalars['Boolean']['input'];
  /** Applies custom field to linked work objects */
  transferable: Scalars['Boolean']['input'];
};

/** Autogenerated return type of CustomFieldConfigurationCreateTrueFalse. */
export type CustomFieldConfigurationCreateTrueFalsePayload = {
  __typename?: 'CustomFieldConfigurationCreateTrueFalsePayload';
  /** The configured true false custom field */
  customFieldConfiguration?: Maybe<CustomFieldConfigurationTrueFalse>;
  /** Errors if there are problems with configuring the true false custom field configuration */
  userErrors: Array<MutationErrors>;
};

/** A dropdown custom field configuration */
export type CustomFieldConfigurationDropdown = CustomFieldConfigurationInterface & {
  __typename?: 'CustomFieldConfigurationDropdown';
  /** The object type to which the CustomFieldConfiguration belongs */
  appliesTo: CustomFieldAppliesTo;
  /** Indicates if the custom field is archived */
  archived: Scalars['Boolean']['output'];
  /** The time the CustomFieldConfiguration was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The default value for a dropdown custom field */
  defaultValue: Scalars['String']['output'];
  /** The list of possible dropdown values of a dropdown custom field */
  dropdownOptions: Array<Scalars['String']['output']>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The name of the CustomFieldConfiguration */
  name: Scalars['String']['output'];
  /** Sets if Custom Field values are editable by Jobber users */
  readOnly: Scalars['Boolean']['output'];
  /** The order in which custom fields are displayed by default in Jobber */
  sortOrder: Scalars['Int']['output'];
  /** Transferable custom fields allow data to appear in multiple places and follow you through your workflow */
  transferable: Scalars['Boolean']['output'];
  /** custom field configuration that this field was transferred from */
  transferedFrom?: Maybe<CustomFieldConfiguration>;
  /** The last time the CustomFieldConfiguration was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** The number of work objects that currently have a value associated with this configuration */
  valueCount: ValueCount;
  /** The type of CustomFieldConfiguration */
  valueType: CustomFieldConfigurationValueType;
};

/** An edge in a connection. */
export type CustomFieldConfigurationEdge = {
  __typename?: 'CustomFieldConfigurationEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: CustomFieldConfiguration;
};

/** Input for editing an existing area custom field configuration */
export type CustomFieldConfigurationEditAreaInput = {
  /** The default values for an area custom field configuration */
  defaultValue?: InputMaybe<CustomFieldConfigurationAreaDefaultValueInput>;
  /** The unit for an area custom field configuration */
  unit?: InputMaybe<Scalars['String']['input']>;
};

/** Input for editing an existing dropdown custom field configuration */
export type CustomFieldConfigurationEditDropdownInput = {
  /** The default value for a dropdown custom field configuration. If not supplied, first value of `dropdownOptions` will be used as the default */
  defaultValue?: InputMaybe<Scalars['String']['input']>;
  /** The default value for a dropdown custom field configuration */
  dropdownOptions?: InputMaybe<Array<Scalars['String']['input']>>;
};

/** Input for editing a custom field configuration */
export type CustomFieldConfigurationEditInput = {
  /** Name for the custom field */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Default values and other attributes for area type custom field values */
  valueArea?: InputMaybe<CustomFieldConfigurationEditAreaInput>;
  /** Default values and other attributes for dropdown type custom field configuration */
  valueDropdown?: InputMaybe<CustomFieldConfigurationEditDropdownInput>;
  /** Default values and other attributes for link type custom field configuration */
  valueLink?: InputMaybe<CustomFieldConfigurationEditLinkInput>;
  /** Default values and other attributes for numeric type custom field configuration */
  valueNumeric?: InputMaybe<CustomFieldConfigurationEditNumericInput>;
  /** Default values and other attributes for link text custom field configuration */
  valueText?: InputMaybe<CustomFieldConfigurationEditTextInput>;
  /** Default values and other attributes for true/false type custom field configuration */
  valueTrueFalse?: InputMaybe<CustomFieldConfigurationEditTrueFalseInput>;
};

/** Input for editing an existing link custom field configuration */
export type CustomFieldConfigurationEditLinkInput = {
  /** The default value for link custom fields */
  defaultValue?: InputMaybe<CustomFieldConfigurationLinkDefaultValueInput>;
};

/** Input for editing an existing numeric custom field configuration */
export type CustomFieldConfigurationEditNumericInput = {
  /** The default value for a numeric custom field configuration */
  defaultValue?: InputMaybe<Scalars['Float']['input']>;
  /** The unit for a numeric custom field configuration */
  unit?: InputMaybe<Scalars['String']['input']>;
};

/** Autogenerated return type of CustomFieldConfigurationEdit. */
export type CustomFieldConfigurationEditPayload = {
  __typename?: 'CustomFieldConfigurationEditPayload';
  /** The modified custom field configuration */
  customFieldConfiguration?: Maybe<CustomFieldConfiguration>;
  /** Errors if there are problems with configuring the custom field configuration */
  userErrors: Array<MutationErrors>;
};

/** Input for editing an existing text custom field configuration */
export type CustomFieldConfigurationEditTextInput = {
  /** The default value for a text custom field */
  defaultValue?: InputMaybe<Scalars['String']['input']>;
};

/** Input for editing a existing True False custom field configuration */
export type CustomFieldConfigurationEditTrueFalseInput = {
  /** The default value for a True False custom field */
  defaultValue: Scalars['Boolean']['input'];
};

export type CustomFieldConfigurationInterface = {
  /** The object type to which the CustomFieldConfiguration belongs */
  appliesTo: CustomFieldAppliesTo;
  /** Indicates if the custom field is archived */
  archived: Scalars['Boolean']['output'];
  /** The time the CustomFieldConfiguration was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The CustomFieldConfiguration ID */
  id: Scalars['EncodedId']['output'];
  /** The name of the CustomFieldConfiguration */
  name: Scalars['String']['output'];
  /** Sets if Custom Field values are editable by Jobber users */
  readOnly: Scalars['Boolean']['output'];
  /** The order in which custom fields are displayed by default in Jobber */
  sortOrder: Scalars['Int']['output'];
  /** Transferable custom fields allow data to appear in multiple places and follow you through your workflow */
  transferable: Scalars['Boolean']['output'];
  /** custom field configuration that this field was transferred from */
  transferedFrom?: Maybe<CustomFieldConfiguration>;
  /** The last time the CustomFieldConfiguration was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** The number of work objects that currently have a value associated with this configuration */
  valueCount: ValueCount;
  /** The type of CustomFieldConfiguration */
  valueType: CustomFieldConfigurationValueType;
};

/** A link custom field configuration */
export type CustomFieldConfigurationLink = CustomFieldConfigurationInterface & {
  __typename?: 'CustomFieldConfigurationLink';
  /** The object type to which the CustomFieldConfiguration belongs */
  appliesTo: CustomFieldAppliesTo;
  /** Indicates if the custom field is archived */
  archived: Scalars['Boolean']['output'];
  /** The time the CustomFieldConfiguration was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The default values for this link custom field */
  defaultValue: CustomFieldConfigurationLinkDefaultValue;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The name of the CustomFieldConfiguration */
  name: Scalars['String']['output'];
  /** Sets if Custom Field values are editable by Jobber users */
  readOnly: Scalars['Boolean']['output'];
  /** The order in which custom fields are displayed by default in Jobber */
  sortOrder: Scalars['Int']['output'];
  /** Transferable custom fields allow data to appear in multiple places and follow you through your workflow */
  transferable: Scalars['Boolean']['output'];
  /** custom field configuration that this field was transferred from */
  transferedFrom?: Maybe<CustomFieldConfiguration>;
  /** The last time the CustomFieldConfiguration was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** The number of work objects that currently have a value associated with this configuration */
  valueCount: ValueCount;
  /** The type of CustomFieldConfiguration */
  valueType: CustomFieldConfigurationValueType;
};

/** The default value for a link custom field */
export type CustomFieldConfigurationLinkDefaultValue = {
  __typename?: 'CustomFieldConfigurationLinkDefaultValue';
  /** The default text for this link custom field */
  text: Scalars['String']['output'];
  /** The default URL for this link custom field */
  url: Scalars['String']['output'];
};

/** Input for specifying the default value for a link custom field configuration */
export type CustomFieldConfigurationLinkDefaultValueInput = {
  /** The default text for link custom fields */
  text: Scalars['String']['input'];
  /** The default URL for link custom fields */
  url?: InputMaybe<Scalars['String']['input']>;
};

/** A numeric custom field configuration */
export type CustomFieldConfigurationNumeric = CustomFieldConfigurationInterface & {
  __typename?: 'CustomFieldConfigurationNumeric';
  /** The object type to which the CustomFieldConfiguration belongs */
  appliesTo: CustomFieldAppliesTo;
  /** Indicates if the custom field is archived */
  archived: Scalars['Boolean']['output'];
  /** The time the CustomFieldConfiguration was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The default number for a numeric custom field */
  defaultValue: Scalars['Float']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The name of the CustomFieldConfiguration */
  name: Scalars['String']['output'];
  /** Sets if Custom Field values are editable by Jobber users */
  readOnly: Scalars['Boolean']['output'];
  /** The order in which custom fields are displayed by default in Jobber */
  sortOrder: Scalars['Int']['output'];
  /** Transferable custom fields allow data to appear in multiple places and follow you through your workflow */
  transferable: Scalars['Boolean']['output'];
  /** custom field configuration that this field was transferred from */
  transferedFrom?: Maybe<CustomFieldConfiguration>;
  /** The unit of a numeric custom field */
  unit: Scalars['String']['output'];
  /** The last time the CustomFieldConfiguration was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** The number of work objects that currently have a value associated with this configuration */
  valueCount: ValueCount;
  /** The type of CustomFieldConfiguration */
  valueType: CustomFieldConfigurationValueType;
};

/** A text custom field configuration */
export type CustomFieldConfigurationText = CustomFieldConfigurationInterface & {
  __typename?: 'CustomFieldConfigurationText';
  /** The object type to which the CustomFieldConfiguration belongs */
  appliesTo: CustomFieldAppliesTo;
  /** Indicates if the custom field is archived */
  archived: Scalars['Boolean']['output'];
  /** The time the CustomFieldConfiguration was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The default value for a text custom field */
  defaultValue: Scalars['String']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The name of the CustomFieldConfiguration */
  name: Scalars['String']['output'];
  /** Sets if Custom Field values are editable by Jobber users */
  readOnly: Scalars['Boolean']['output'];
  /** The order in which custom fields are displayed by default in Jobber */
  sortOrder: Scalars['Int']['output'];
  /** Transferable custom fields allow data to appear in multiple places and follow you through your workflow */
  transferable: Scalars['Boolean']['output'];
  /** custom field configuration that this field was transferred from */
  transferedFrom?: Maybe<CustomFieldConfiguration>;
  /** The last time the CustomFieldConfiguration was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** The number of work objects that currently have a value associated with this configuration */
  valueCount: ValueCount;
  /** The type of CustomFieldConfiguration */
  valueType: CustomFieldConfigurationValueType;
};

/** A true false custom field configuration */
export type CustomFieldConfigurationTrueFalse = CustomFieldConfigurationInterface & {
  __typename?: 'CustomFieldConfigurationTrueFalse';
  /** The object type to which the CustomFieldConfiguration belongs */
  appliesTo: CustomFieldAppliesTo;
  /** Indicates if the custom field is archived */
  archived: Scalars['Boolean']['output'];
  /** The time the CustomFieldConfiguration was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The default value for a TrueFalse custom field */
  defaultValue: Scalars['Boolean']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The name of the CustomFieldConfiguration */
  name: Scalars['String']['output'];
  /** Sets if Custom Field values are editable by Jobber users */
  readOnly: Scalars['Boolean']['output'];
  /** The order in which custom fields are displayed by default in Jobber */
  sortOrder: Scalars['Int']['output'];
  /** Transferable custom fields allow data to appear in multiple places and follow you through your workflow */
  transferable: Scalars['Boolean']['output'];
  /** custom field configuration that this field was transferred from */
  transferedFrom?: Maybe<CustomFieldConfiguration>;
  /** The last time the CustomFieldConfiguration was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** The number of work objects that currently have a value associated with this configuration */
  valueCount: ValueCount;
  /** The type of CustomFieldConfiguration */
  valueType: CustomFieldConfigurationValueType;
};

/** Autogenerated return type of CustomFieldConfigurationUnarchive. */
export type CustomFieldConfigurationUnarchivePayload = {
  __typename?: 'CustomFieldConfigurationUnarchivePayload';
  /** The unarchived custom field configurations */
  customFieldConfigurations?: Maybe<Array<CustomFieldConfiguration>>;
  /** Errors if there are problems with configuring the custom field configuration */
  userErrors: Array<MutationErrors>;
};

export type CustomFieldConfigurationValueType =
  /** The value type for an area custom field configuration */
  | 'AREA'
  /** The value type for a dropdown custom field configuration */
  | 'DROPDOWN'
  /** The value type for a link custom field configuration */
  | 'LINK'
  /** The value type for an numeric custom field configuration */
  | 'NUMERIC'
  /** The value type for a text custom field configuration */
  | 'TEXT'
  /** The value type for a true false custom field configuration */
  | 'TRUE_FALSE';

/** CustomFieldConfigurations filter input */
export type CustomFieldConfigurationsFilterInput = {
  /** The object the CustomFieldConfigurations apply to */
  appliesTo?: InputMaybe<CustomFieldAppliesTo>;
  /** Only include configurations created by the current app */
  createdByThisApp?: InputMaybe<Scalars['Boolean']['input']>;
  /** The type of CustomFieldConfiguration */
  valueType?: InputMaybe<CustomFieldConfigurationValueType>;
};

/** The attributes to sort on a collection of custom field configurations */
export type CustomFieldConfigurationsSortInput = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The key to sort on */
  key: CustomFieldConfigurationsSortKey;
};

/** The fields, or associated fields, on a collection of custom field configurations which support sorting functionality */
export type CustomFieldConfigurationsSortKey =
  /** The field which indicates when the CustomFieldConfiguration was created */
  | 'CREATED_AT'
  /** Sort by the position of the custom field configurations */
  | 'SORT_ORDER';

/** Attributes for creating custom fields. Exactly one of the values (or both valueAreaLength and valueAreaWidth) must be provided and it (they) must match the correct type. */
export type CustomFieldCreateInput = {
  /** The ID of the custom field configuration being changed */
  customFieldConfigurationId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** Attributes for area type custom field values */
  valueArea?: InputMaybe<CustomFieldValueAreaInput>;
  /** The dropdown value to set */
  valueDropdown?: InputMaybe<Scalars['String']['input']>;
  /** Attributes for link type custom field values */
  valueLink?: InputMaybe<CustomFieldValueLinkInput>;
  /** The numeric value to set */
  valueNumeric?: InputMaybe<Scalars['Float']['input']>;
  /** The text value to set */
  valueText?: InputMaybe<Scalars['String']['input']>;
  /** The true/false value to set */
  valueTrueFalse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** A custom field with dropdown options */
export type CustomFieldDropdown = {
  __typename?: 'CustomFieldDropdown';
  /** The dropdown custom field configuration for this value */
  customFieldConfiguration: CustomFieldConfigurationDropdown;
  /** The list of possible values of this field */
  dropdownOptions: Array<Scalars['String']['output']>;
  /** The ID of this custom field. */
  id?: Maybe<Scalars['EncodedId']['output']>;
  /** The label to display for this field. */
  label: Scalars['String']['output'];
  /** The dropdown value of this custom field */
  valueDropdown: Scalars['String']['output'];
};

/** Attributes for updating custom fields */
export type CustomFieldEditInput = {
  /** The ID of the custom field configuration being changed */
  customFieldConfigurationId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The ID of the custom field value being changed */
  id?: InputMaybe<Scalars['EncodedId']['input']>;
  /** Attributes for area type custom field values */
  valueArea?: InputMaybe<CustomFieldValueAreaInput>;
  /** The dropdown value to set */
  valueDropdown?: InputMaybe<Scalars['String']['input']>;
  /** Attributes for link type custom field values */
  valueLink?: InputMaybe<CustomFieldValueLinkInput>;
  /** The numeric value to set */
  valueNumeric?: InputMaybe<Scalars['Float']['input']>;
  /** The text value to set */
  valueText?: InputMaybe<Scalars['String']['input']>;
  /** The true/false value to set */
  valueTrueFalse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** A link custom field */
export type CustomFieldLink = {
  __typename?: 'CustomFieldLink';
  /** The link custom field configuration for this value. */
  customFieldConfiguration: CustomFieldConfigurationLink;
  /** The ID of this custom field. */
  id?: Maybe<Scalars['EncodedId']['output']>;
  /** The label to display for this field. */
  label: Scalars['String']['output'];
  /** The value of the custom field link */
  valueLink: CustomFieldLinkValue;
};

/** A link custom field value */
export type CustomFieldLinkValue = {
  __typename?: 'CustomFieldLinkValue';
  /** The link label text for this link custom field */
  text: Scalars['String']['output'];
  /** The URL for this link custom field */
  url: Scalars['String']['output'];
};

/** A custom field with a numeric value */
export type CustomFieldNumeric = {
  __typename?: 'CustomFieldNumeric';
  /** The numeric custom field configuration for this value */
  customFieldConfiguration: CustomFieldConfigurationNumeric;
  /** The ID of this custom field. */
  id?: Maybe<Scalars['EncodedId']['output']>;
  /** The label to display for this field. */
  label: Scalars['String']['output'];
  /** The unit of this field */
  unit: Scalars['String']['output'];
  /** The numeric value of this field */
  valueNumeric: Scalars['Float']['output'];
};

/** A text custom field */
export type CustomFieldText = {
  __typename?: 'CustomFieldText';
  /** The text custom field configuration for this value. */
  customFieldConfiguration: CustomFieldConfigurationText;
  /** The ID of this custom field. */
  id?: Maybe<Scalars['EncodedId']['output']>;
  /** The label to display for this field. */
  label: Scalars['String']['output'];
  /** The value of this field. */
  valueText: Scalars['String']['output'];
};

/** A custom field with true or false for the value */
export type CustomFieldTrueFalse = {
  __typename?: 'CustomFieldTrueFalse';
  /** The true or false custom field configuration for this value */
  customFieldConfiguration: CustomFieldConfigurationTrueFalse;
  /** The ID of this custom field. */
  id?: Maybe<Scalars['EncodedId']['output']>;
  /** The label to display for this field. */
  label: Scalars['String']['output'];
  /** The value of this field which can be either true or false */
  valueTrueFalse: Scalars['Boolean']['output'];
};

/** Union of custom fields */
export type CustomFieldUnion = CustomFieldArea | CustomFieldDropdown | CustomFieldLink | CustomFieldNumeric | CustomFieldText | CustomFieldTrueFalse;

/** Attributes for area type custom field values */
export type CustomFieldValueAreaInput = {
  /** The length value to set */
  length?: InputMaybe<Scalars['Float']['input']>;
  /** The width value to set */
  width?: InputMaybe<Scalars['Float']['input']>;
};

/** Attributes for link type custom field values */
export type CustomFieldValueLinkInput = {
  /** The link label text value to set */
  text?: InputMaybe<Scalars['String']['input']>;
  /** The url value to set */
  url?: InputMaybe<Scalars['String']['input']>;
};

export type CustomFieldsInterface = {
  /** The custom fields set for this object */
  customFields: Array<CustomFieldUnion>;
};

/** Represents a custom lead source that can be created by an SP. */
export type CustomLeadSource = {
  __typename?: 'CustomLeadSource';
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The label for the lead source */
  label: Scalars['String']['output'];
};

/** Date range for filtering */
export type DateRange = {
  /** The end timestamp filter */
  endAt: Scalars['ISO8601DateTime']['input'];
  /** The start timestamp filter */
  startAt: Scalars['ISO8601DateTime']['input'];
};

/** A Deposit Balance Transaction */
export type DepositBalanceTransaction = BalanceTransactionInterface & {
  __typename?: 'DepositBalanceTransaction';
  /** The date the balance transaction was created */
  created: Scalars['ISO8601DateTime']['output'];
  /** The type of currency used */
  currency: Scalars['String']['output'];
  /** The balance transaction fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The balance transaction gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The balance transaction net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The balance transaction type */
  type?: Maybe<BalanceTransaction>;
};

/** The device platform for terminal payments */
export type DevicePlatform =
  /** Android device platform */
  | 'ANDROID'
  /** iOS device platform */
  | 'IOS';

/** Attributes for creating and editing a discount */
export type DiscountInput = {
  /** The discount rate of the invoice */
  discountRate?: InputMaybe<Scalars['Float']['input']>;
  /** The discount type of the invoice */
  discountType?: InputMaybe<CostModifierTypeEnum>;
};

/** A Dispute Balance Transaction */
export type DisputeBalanceTransaction = BalanceTransactionInterface & {
  __typename?: 'DisputeBalanceTransaction';
  /** The date the balance transaction was created */
  created: Scalars['ISO8601DateTime']['output'];
  /** The type of currency used */
  currency: Scalars['String']['output'];
  /** The balance transaction fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The balance transaction gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The balance transaction net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The payment record associated with */
  paymentRecord?: Maybe<PaymentRecordInterface>;
  /** The balance transaction type */
  type?: Maybe<BalanceTransaction>;
};

/** The unit to calculate the duration */
export type DurationUnit =
  /** Days */
  | 'DAYS'
  /** Months */
  | 'MONTHS'
  /** Weeks */
  | 'WEEKS'
  /** Years */
  | 'YEARS';

/** An e-payment applied to a quote or invoice */
export type EPaymentPaymentRecord = PaymentRecordInterface & {
  __typename?: 'EPaymentPaymentRecord';
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance (absolute value) */
  amount: Scalars['Float']['output'];
  /** Whether the payment can be edited */
  canEdit: Scalars['Boolean']['output'];
  /** The client associated with the payment */
  client?: Maybe<Client>;
  /** Additional details about the payment */
  details?: Maybe<Scalars['String']['output']>;
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The gateway used for the payment */
  gatewayName?: Maybe<Scalars['String']['output']>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The invoice associated with the payment */
  invoice?: Maybe<Invoice>;
  /** Where the payment originated from */
  paymentOrigin?: Maybe<PaymentOrigin>;
  /** The type of payment used, i.e cash, check, Jobber Payments... */
  paymentType?: Maybe<PaymentType>;
  /** The quote associated with the deposit payment */
  quote?: Maybe<Quote>;
  /** The raw amount applied against the quote or invoice balance (preserves sign). */
  rawAmount: Scalars['Float']['output'];
  /** Refunds associated with the payment */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** If sent, the DateTime the payment record was sent to client. */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};


/** An e-payment applied to a quote or invoice */
export type EPaymentPaymentRecordAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** An e-payment applied to a quote or invoice */
export type EPaymentPaymentRecordRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** An e-transfer payment applied to a quote or invoice */
export type ETransferPaymentRecord = PaymentRecordInterface & {
  __typename?: 'ETransferPaymentRecord';
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance (absolute value) */
  amount: Scalars['Float']['output'];
  /** Whether the payment can be edited */
  canEdit: Scalars['Boolean']['output'];
  /** The client associated with the payment */
  client?: Maybe<Client>;
  /** The confirmation number of the e-Transfer payment */
  confirmationNumber?: Maybe<Scalars['String']['output']>;
  /** Additional details about the payment */
  details?: Maybe<Scalars['String']['output']>;
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The invoice associated with the payment */
  invoice?: Maybe<Invoice>;
  /** Where the payment originated from */
  paymentOrigin?: Maybe<PaymentOrigin>;
  /** The type of payment used, i.e cash, check, Jobber Payments... */
  paymentType?: Maybe<PaymentType>;
  /** The quote associated with the deposit payment */
  quote?: Maybe<Quote>;
  /** The raw amount applied against the quote or invoice balance (preserves sign). */
  rawAmount: Scalars['Float']['output'];
  /** Refunds associated with the payment */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** If sent, the DateTime the payment record was sent to client. */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};


/** An e-transfer payment applied to a quote or invoice */
export type ETransferPaymentRecordAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** An e-transfer payment applied to a quote or invoice */
export type ETransferPaymentRecordRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** Autogenerated return type of Edit. */
export type EditPayload = {
  __typename?: 'EditPayload';
  /** The updated product or service */
  productOrService?: Maybe<ProductOrService>;
  /** Errors encountered when creating the product or service */
  userErrors: Array<MutationErrors>;
};

/** How to handle buffer time between appointments */
export type EfficientSchedulingType =
  /** Use a fixed buffer time between appointments */
  | 'BUFFER_TIME'
  /** Use a buffer time based on a client's location and the drive time to their location from other appointments */
  | 'DRIVE_TIME'
  /** No time restrictions */
  | 'NONE';

/** Email information */
export type Email = {
  __typename?: 'Email';
  /** The email address as stored. */
  address: Scalars['String']['output'];
  /** The client attached to this email */
  client: Client;
  /** The contact attached to this email */
  contact?: Maybe<ContactModel>;
  /** The email address type (eg Main, Work, Personal, Other). */
  description: Scalars['String']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** Is this the primary email address? */
  primary: Scalars['Boolean']['output'];
};

/** The connection type for Email. */
export type EmailConnection = {
  __typename?: 'EmailConnection';
  /** A list of edges. */
  edges?: Maybe<Array<EmailEdge>>;
  /** A list of nodes. */
  nodes: Array<Email>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** Attributes of an email address */
export type EmailCreateAttributes = {
  /** The email address as stored. */
  address?: InputMaybe<Scalars['String']['input']>;
  /** The email address type. */
  description?: InputMaybe<EmailDescription>;
  /** Is this the primary email address? */
  primary?: InputMaybe<Scalars['Boolean']['input']>;
};

export type EmailDescription =
  /** The email is of type Main */
  | 'MAIN'
  /** The email is of type Other */
  | 'OTHER'
  /** The email is of type Personal */
  | 'PERSONAL'
  /** The email is of type Work */
  | 'WORK';

/** An edge in a connection. */
export type EmailEdge = {
  __typename?: 'EmailEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Email;
};

/** Attributes for filtering emails */
export type EmailFilterInput = {
  /** Whether to include emails attached to secondary contacts */
  includeSecondaryContacts?: InputMaybe<Scalars['Boolean']['input']>;
  /** The properties to filter emails by. This filter has no effect without include_secondary_contacts set to true */
  propertyIds?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
};

/** An email address */
export type EmailInterface = {
  /** Is the email address valid */
  isValid: Scalars['Boolean']['output'];
  /** The email address as stored (may be standard or what was entered by user) */
  raw: Scalars['String']['output'];
};

/** The types of emails that we can currently accept */
export type EmailTypes =
  | 'ASSESSMENT_BOOKED'
  | 'ASSESSMENT_REMINDER'
  | 'BALANCE_ADJUSTMENT_RECEIPT_SENT'
  | 'CLIENT'
  | 'CLIENT_HUB_LOGIN_LINK'
  | 'FOLLOW_UP_SENT'
  | 'INVOICE_SENT'
  | 'JOB_BOOKING_CONFIRMATION'
  | 'JOB_FORM_SENT'
  | 'JOB_FORM_SUBMISSION_SENT'
  | 'QUOTE_SENT'
  | 'REQUEST_CARD_ON_FILE'
  | 'SIGNED_DOCUMENT_SENT'
  | 'STATEMENT_SENT'
  | 'VISIT_REMINDER';

/** Attributes of an email address */
export type EmailUpdateAttributes = {
  /** The email address as stored. */
  address?: InputMaybe<Scalars['String']['input']>;
  /** The email address type. */
  description?: InputMaybe<EmailDescription>;
  /** The id of the email address being changed. */
  id: Scalars['EncodedId']['input'];
  /** Is this the primary email address? */
  primary?: InputMaybe<Scalars['Boolean']['input']>;
};

/** An event represents each time a Service Provider has scheduled holidays, team meetings, etc. */
export type Event = ScheduledItemInterface & {
  __typename?: 'Event';
  /** Indicates whether the scheduled item is for a full day */
  allDay: Scalars['Boolean']['output'];
  /** Users assigned to the scheduled item */
  assignedUsers?: Maybe<UserConnection>;
  /** The client for the event */
  client?: Maybe<Client>;
  /** The user that created this scheduled item */
  createdBy?: Maybe<User>;
  /** The instructions for the event */
  description?: Maybe<Scalars['String']['output']>;
  /** Minute duration between start and end time. */
  duration?: Maybe<Scalars['Int']['output']>;
  /** End date and time of the scheduled item. An unscheduled visit is represented by both startAt and endAt being null */
  endAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** Whether the event has been completed */
  isComplete: Scalars['Boolean']['output'];
  /** Indicates whether the title is the default */
  isDefaultTitle: Scalars['Boolean']['output'];
  /** Indicates if the event is part of a recurring chain */
  isRecurring: Scalars['Boolean']['output'];
  /** An override for ordering anytime and unscheduled items */
  overrideOrder?: Maybe<Scalars['Int']['output']>;
  /** The property for the event */
  property?: Maybe<Property>;
  /** Recurrence details */
  recurrenceSchedule?: Maybe<RecurrenceSchedule>;
  /** The summary of a recurring event */
  recurringSummary?: Maybe<Scalars['String']['output']>;
  /** The order in which the scheduled item should be routed */
  routingOrder?: Maybe<Scalars['Int']['output']>;
  /** Start date and time of the scheduled item. An unscheduled visit is represented by both startAt and endAt being null */
  startAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Offset in minutes from the time of the scheduled item to notify the team */
  teamReminderOffset?: Maybe<Scalars['Minutes']['output']>;
  /** The title of the scheduled item */
  title?: Maybe<Scalars['String']['output']>;
};


/** An event represents each time a Service Provider has scheduled holidays, team meetings, etc. */
export type EventAssignedUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** Input for creating a new event */
export type EventCreateInput = {
  /** Indicates whether this is an all day event */
  allDay?: InputMaybe<Scalars['Boolean']['input']>;
  /** Details to describe the event */
  description?: InputMaybe<Scalars['String']['input']>;
  /** When the event ends */
  endAt?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
  /** The ICalendarRecurrenceRule that will be used for scheduling events */
  recurrenceRule?: InputMaybe<Scalars['ICalendarRule']['input']>;
  /** When the event starts */
  startAt: Scalars['ISO8601DateTime']['input'];
  /** Title of the event */
  title: Scalars['String']['input'];
};

/** Autogenerated return type of EventCreate. */
export type EventCreatePayload = {
  __typename?: 'EventCreatePayload';
  /** The created event */
  event?: Maybe<Event>;
  /** Errors encountered in creating event */
  userErrors: Array<MutationErrors>;
};

/** An expense incurred by a Service Provider */
export type Expense = {
  __typename?: 'Expense';
  /** When the expense was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** When the expense was incurred */
  date: Scalars['ISO8601DateTime']['output'];
  /** The description of the expense */
  description?: Maybe<Scalars['String']['output']>;
  /** The user who filled out the expense */
  enteredBy?: Maybe<User>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The associated Job */
  linkedJob?: Maybe<Job>;
  /** The user who paid the expense */
  paidBy?: Maybe<User>;
  /** The user receiving the reimbursed expense amount */
  reimbursableTo?: Maybe<User>;
  /** The title of the expense */
  title: Scalars['String']['output'];
  /** Total cost of the expense */
  total?: Maybe<Scalars['Float']['output']>;
  /** When the expense was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

/** The connection type for Expense. */
export type ExpenseConnection = {
  __typename?: 'ExpenseConnection';
  /** A list of edges. */
  edges?: Maybe<Array<ExpenseEdge>>;
  /** A list of nodes. */
  nodes: Array<Expense>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** Attributes for creating a new expense */
export type ExpenseCreateInput = {
  /** Accounting code for this expense */
  accountingCodeId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** When the expense was incurred */
  date: Scalars['ISO8601DateTime']['input'];
  /** Details about the expense */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The associated job */
  linkedJobId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The signed blob ID from ActiveStorage for an already uploaded file. Takes precedence over receipt_url if both provided. */
  receiptSignedBlobId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The URL for the receipt */
  receiptUrl?: InputMaybe<Scalars['String']['input']>;
  /** The user to be reimbursed */
  reimbursableToId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The title of the expense */
  title: Scalars['String']['input'];
  /** The total cost of the expense */
  total?: InputMaybe<Scalars['Float']['input']>;
};

/** Autogenerated return type of ExpenseCreate. */
export type ExpenseCreatePayload = {
  __typename?: 'ExpenseCreatePayload';
  /** The created expense */
  expense?: Maybe<Expense>;
  /** Errors encountered when creating the expense */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of ExpenseDelete. */
export type ExpenseDeletePayload = {
  __typename?: 'ExpenseDeletePayload';
  /** The deleted expense */
  deletedExpense?: Maybe<Expense>;
  /** Errors encountered when trying to delete the expense */
  userErrors: Array<MutationErrors>;
};

/** An edge in a connection. */
export type ExpenseEdge = {
  __typename?: 'ExpenseEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Expense;
};

/** Input for modifying an existing expense */
export type ExpenseEditInput = {
  /** The associated accounting code of the expense */
  accountingCodeId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The date the expense was incurred */
  date?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
  /** The description of the expense */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The signed blob ID from ActiveStorage for an already uploaded file. Takes precedence over receipt_url if both provided. */
  receiptSignedBlobId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The image url with receipt of the expense */
  receiptUrl?: InputMaybe<Scalars['String']['input']>;
  /** The user to be reimbursed */
  reimbursableToId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The title of the expense item */
  title?: InputMaybe<Scalars['String']['input']>;
  /** The total cost of the expense */
  total?: InputMaybe<Scalars['Float']['input']>;
};

/** Autogenerated return type of ExpenseEdit. */
export type ExpenseEditPayload = {
  __typename?: 'ExpenseEditPayload';
  /** The modified expense */
  expense?: Maybe<Expense>;
  /** Errors encountered when modifying the expense */
  userErrors: Array<MutationErrors>;
};

/** Attributes for filtering expenses */
export type ExpenseFilterAttributes = {
  /** The expenses created_at date to filter by */
  createdAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The expenses date it was submitted for to filter by */
  date?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The ID of the user who entered the expense */
  enteredById?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The ID of the user who the expense should be reimbursed to */
  reimbursableToId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The expenses updated_at date to filter by */
  updatedAt?: InputMaybe<Iso8601DateTimeRangeInput>;
};

/** The attributes to sort on a collection of expenses */
export type ExpensesSortInput = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The key to sort on */
  key: ExpensesSortKey;
};

/** The fields on a collection of expenses which support sorting functionality */
export type ExpensesSortKey =
  /** The field which indicates when the expense was created at */
  | 'CREATED_AT'
  /** The field which indicates the date the expense was filed for */
  | 'DATE'
  /** The field which indicates when the expense was last updated at */
  | 'UPDATED_AT';

/** A reminder from an external integration that requires user attention */
export type ExternalReminder = {
  __typename?: 'ExternalReminder';
  /** When the reminder was completed */
  completedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** When the reminder was created in Jobber */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** Description of the reminder */
  description?: Maybe<Scalars['String']['output']>;
  /** When the reminder was first requested by the external system */
  firstRequestedAt: Scalars['ISO8601DateTime']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** When the reminder was last requested by the external system */
  lastRequestedAt: Scalars['ISO8601DateTime']['output'];
  /** The type/category of reminder from the source system */
  reminderType: Scalars['String']['output'];
  /** The ID from the external system */
  sourceId: Scalars['String']['output'];
  /** The integration source type (e.g., 'asset_bookkeeping') */
  sourceType: Scalars['String']['output'];
  /** The status of the reminder (pending, viewed, completed) */
  status: Scalars['String']['output'];
  /** When the reminder was last updated in Jobber */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** When the user viewed the reminder */
  viewedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};

/** The connection type for ExternalReminder. */
export type ExternalReminderConnection = {
  __typename?: 'ExternalReminderConnection';
  /** A list of edges. */
  edges?: Maybe<Array<ExternalReminderEdge>>;
  /** A list of nodes. */
  nodes: Array<ExternalReminder>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type ExternalReminderEdge = {
  __typename?: 'ExternalReminderEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: ExternalReminder;
};

/** A Fee Adjustment Balance Transaction */
export type FeeAdjustmentBalanceTransaction = BalanceTransactionInterface & {
  __typename?: 'FeeAdjustmentBalanceTransaction';
  /** The date the balance transaction was created */
  created: Scalars['ISO8601DateTime']['output'];
  /** The type of currency used */
  currency: Scalars['String']['output'];
  /** The balance transaction fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The balance transaction gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The balance transaction net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The balance transaction type */
  type?: Maybe<BalanceTransaction>;
};

/** Uploadable file attachment from amazon s3. If s3_key, and signed_blob_id are passed in, signed_blob_id will take precedence */
export type FileAttachmentAttributes = {
  /** The type of file */
  contentType: Scalars['String']['input'];
  /** The name of the file */
  fileName: Scalars['String']['input'];
  /** The size of file */
  fileSize: Scalars['Int']['input'];
  /** The jobber object id of the parent */
  fileableId?: InputMaybe<Scalars['ID']['input']>;
  /** The jobber object type of the parent */
  fileableType: Scalars['String']['input'];
  /** The id of the file attachment */
  id?: InputMaybe<Scalars['ID']['input']>;
  /** The associated key in amazon s3 */
  s3Key?: InputMaybe<Scalars['String']['input']>;
  /** The signed blob ID from ActiveStorage for an already uploaded file. Takes precedence over S3 key when present. */
  signedBlobId?: InputMaybe<Scalars['EncodedId']['input']>;
};

/** A Financing Payout Balance Transaction */
export type FinancingPayoutBalanceTransaction = BalanceTransactionInterface & {
  __typename?: 'FinancingPayoutBalanceTransaction';
  /** The date the balance transaction was created */
  created: Scalars['ISO8601DateTime']['output'];
  /** The type of currency used */
  currency: Scalars['String']['output'];
  /** The balance transaction fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The balance transaction gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The balance transaction net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The balance transaction type */
  type?: Maybe<BalanceTransaction>;
};

/** A Financing Repayment Balance Transaction */
export type FinancingRepaymentBalanceTransaction = BalanceTransactionInterface & {
  __typename?: 'FinancingRepaymentBalanceTransaction';
  /** The date the balance transaction was created */
  created: Scalars['ISO8601DateTime']['output'];
  /** The type of currency used */
  currency: Scalars['String']['output'];
  /** The balance transaction fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The balance transaction gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The balance transaction net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The balance transaction type */
  type?: Maybe<BalanceTransaction>;
};

/** Select a range of Float, use either `eq` or `min` and `max`, but not both. `min` or `max` can be `null` when used together to expand the range infinitely */
export type FloatRangeInput = {
  /** The exact Float to select */
  eq?: InputMaybe<Scalars['Float']['input']>;
  /** The maximum Float to select */
  max?: InputMaybe<Scalars['Float']['input']>;
  /** The minimum Float to select */
  min?: InputMaybe<Scalars['Float']['input']>;
};

/** Attributes for attaching or detaching forms */
export type FormAttachmentInput = {
  /** Form id */
  formIds: Array<Scalars['EncodedId']['input']>;
};

/** Input for a form */
export type FormInput = {
  /** Sections of the form (1+ required) */
  sections: Array<FormSectionInput>;
};

/** Input for a question and answer form item within a section */
export type FormItemInput = {
  /** Answer when question type is text */
  answerText?: InputMaybe<Scalars['String']['input']>;
  /** Question for the form item */
  label: Scalars['String']['input'];
};

/** Input for a form section */
export type FormSectionInput = {
  /** Items in the section (1+ required) */
  items: Array<FormItemInput>;
  /** Label for the section */
  label: Scalars['String']['input'];
};

/** Input type for latitude and longitude of a vehicle */
export type GpsPositionInput = {
  /** The latitude of the vehicle's position */
  latitude: Scalars['Float']['input'];
  /** The longitude of the vehicle's position */
  longitude: Scalars['Float']['input'];
  /** The timestamp for the last data refresh */
  timestamp: Scalars['ISO8601DateTime']['input'];
};

/** A geographic coordinate with a single point */
export type GeoPoint = {
  __typename?: 'GeoPoint';
  /** The geographic coordinate that specifies the north-south position of a point on the Earth's surface */
  latitude: Scalars['Float']['output'];
  /** The geographic coordinate that specifies the north-south position of a point on the Earth's surface as a string */
  latitudeString: Scalars['String']['output'];
  /** The geographic coordinate that specifies the east-west position of a point on the Earth's surface */
  longitude: Scalars['Float']['output'];
  /** The geographic coordinate that specifies the east-west position of a point on the Earth's surface as a string */
  longitudeString: Scalars['String']['output'];
  /** The geographic coordinate point that combines latitude and longitude */
  point: Scalars['String']['output'];
};

/** The status of geo-locating the coordinates for an address */
export type GeoStatus =
  /** Found */
  | 'FOUND'
  /** Found alternate */
  | 'FOUND_ALTERNATE'
  /** Manual override */
  | 'MANUAL_OVERRIDE'
  /** Not found */
  | 'NOT_FOUND'
  /** Not started */
  | 'NOT_STARTED'
  /** Processing */
  | 'PROCESSING';

/** Represents the latitude and longitude of a vehicle's position */
export type GpsPositionType = {
  __typename?: 'GpsPositionType';
  /** The latitude of the vehicle's position */
  latitude: Scalars['Float']['output'];
  /** The longitude of the vehicle's position */
  longitude: Scalars['Float']['output'];
  /** The timestamp for the position data */
  timestamp: Scalars['ISO8601DateTime']['output'];
};

export type IncomeAdjustmentType =
  /** Represents the amount that has been marked bad debt */
  | 'BAD_DEBT'
  /** Is a correction */
  | 'CORRECTION'
  /** Is a deposit */
  | 'DEPOSIT'
  /** Is a failed ACH payment */
  | 'FAILED_ACH_PAYMENT'
  /** Is an initial balance */
  | 'INITIAL_BALANCE'
  /** Is an invoice */
  | 'INVOICE'
  /** Is a payment */
  | 'PAYMENT'
  /** Is a refund */
  | 'REFUND';

export type IncompleteVisitDecisionEnum =
  /** complete all past incomplete visits up to those due by the end of the current day, destroy all incomplete future visits */
  | 'COMPLETE_PAST_DESTROY_FUTURE'
  /** destroy all incomplete visits from the job */
  | 'DESTROY_ALL';

export type Industry =
  /** Appliance Repair */
  | 'APPLIANCE_REPAIR'
  /** Arborist / Tree Care */
  | 'ARBORIST_TREE_CARE'
  /** Bin Cleaning */
  | 'BIN_CLEANING'
  /** Carpet Cleaning */
  | 'CARPET_CLEANING'
  /** Commercial Cleaning */
  | 'COMMERCIAL_CLEANING'
  /** Computers & IT */
  | 'COMPUTERS_IT'
  /** Construction & Contracting */
  | 'CONSTRUCTION_CONTRACTING'
  /** Electrical Contractor */
  | 'ELECTRICAL_CONTRACTOR'
  /** Flooring Service */
  | 'FLOORING_SERVICE'
  /** Handyman */
  | 'HANDYMAN'
  /** Home Theater */
  | 'HOME_THEATER'
  /** HVAC */
  | 'HVAC'
  /** Junk Removal */
  | 'JUNK_REMOVAL'
  /** Landscaping Contractor */
  | 'LANDSCAPING_CONTRACTOR'
  /** Lawn Care & Lawn Maintenance */
  | 'LAWN_CARE_LAWN_MAINTENANCE'
  /** Locksmith */
  | 'LOCKSMITH'
  /** Mechanical Service */
  | 'MECHANICAL_SERVICE'
  /** Other */
  | 'OTHER'
  /** Painting */
  | 'PAINTING'
  /** Pest Control */
  | 'PEST_CONTROL'
  /** Plumbing */
  | 'PLUMBING'
  /** Pool and Spa Service */
  | 'POOL_AND_SPA_SERVICE'
  /** Pressure Washing Service */
  | 'PRESSURE_WASHING_SERVICE'
  /** Renovations */
  | 'RENOVATIONS'
  /** Residential Cleaning */
  | 'RESIDENTIAL_CLEANING'
  /** Roofing Service */
  | 'ROOFING_SERVICE'
  /** Security and Alarm */
  | 'SECURITY_AND_ALARM'
  /** Snow Removal */
  | 'SNOW_REMOVAL'
  /** Window Washing */
  | 'WINDOW_WASHING';

/** A Instant Payout Balance Transaction  */
export type InstantPayoutBalanceTransaction = BalanceTransactionInterface & {
  __typename?: 'InstantPayoutBalanceTransaction';
  /** The date the balance transaction was created */
  created: Scalars['ISO8601DateTime']['output'];
  /** The type of currency used */
  currency: Scalars['String']['output'];
  /** The balance transaction fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The balance transaction gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The balance transaction net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The payout record associated with */
  payoutRecord?: Maybe<PayoutRecord>;
  /** The balance transaction type */
  type?: Maybe<BalanceTransaction>;
};

/** A Instant Payout Fee Balance Transaction */
export type InstantPayoutFeeBalanceTransaction = BalanceTransactionInterface & {
  __typename?: 'InstantPayoutFeeBalanceTransaction';
  /** The date the balance transaction was created */
  created: Scalars['ISO8601DateTime']['output'];
  /** The type of currency used */
  currency: Scalars['String']['output'];
  /** The balance transaction fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The balance transaction gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The balance transaction net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The balance transaction type */
  type?: Maybe<BalanceTransaction>;
};

/** Select a range of Integer, use either `eq` or `min` and `max`, but not both. `min` or `max` can be `null` when used together to expand the range infinitely */
export type IntRangeInput = {
  /** The exact Int to select */
  eq?: InputMaybe<Scalars['Int']['input']>;
  /** The maximum Int to select */
  max?: InputMaybe<Scalars['Int']['input']>;
  /** The minimum Int to select */
  min?: InputMaybe<Scalars['Int']['input']>;
};

/** A request for payment which Service Providers send to their clients after the work is done */
export type Invoice = CustomFieldsInterface & {
  __typename?: 'Invoice';
  /** Allow SMS to be sent to client for Google Reviews feature */
  allowReviewRequest: Scalars['Boolean']['output'];
  /** All amounts related to the invoice */
  amounts?: Maybe<InvoiceAmounts>;
  /** The archived jobs related to the invoice */
  archivedJobs: JobConnection;
  /** The billing address associated with the invoice */
  billingAddress?: Maybe<InvoiceBillingAddress>;
  /** If invoice has a billing address, returns whether the billing address is the same as the property address */
  billingIsSameAsPropertyAddress?: Maybe<Scalars['Boolean']['output']>;
  /** The client the invoice is for */
  client?: Maybe<Client>;
  /** URI of the invoice in client hub */
  clientHubUri?: Maybe<Scalars['String']['output']>;
  /** The contract disclaimer for the invoice */
  contractDisclaimer?: Maybe<Scalars['String']['output']>;
  /** The date the invoice was created on */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /**
   * The custom fields set on the invoice
   * @deprecated Use `custom_fields` instead
   */
  customFieldValues: Array<CustomFieldUnion>;
  /** The custom fields set for this object */
  customFields: Array<CustomFieldUnion>;
  /** The date the invoice was viewed in client hub */
  dateViewedInClientHub?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /**
   * The deposit amount on the invoice
   * @deprecated All amounts related information are now included in the field `amounts`, please use the `amounts` field instead
   */
  depositAmount: Scalars['Float']['output'];
  /**
   * Whether ach payments are disabled on the invoice
   * @deprecated Use payment_settings field instead
   */
  disableClientHubAchPayments: Scalars['Boolean']['output'];
  /**
   * Whether credit card payments are disabled on the invoice
   * @deprecated Use payment_settings field instead
   */
  disableClientHubCreditCardPayments: Scalars['Boolean']['output'];
  /**
   * The discount amount on the invoice
   * @deprecated All amounts related information are now included in the field `amounts`, please use the `amounts` field instead
   */
  discountAmount: Scalars['Float']['output'];
  /**
   * The discount rate on the invoice
   * @deprecated Use discount field instead
   */
  discountRate: Scalars['Float']['output'];
  /**
   * The discount type on the invoice - dollar amount or percent
   * @deprecated Use discount field instead
   */
  discountType: Scalars['String']['output'];
  /** The date the invoice is due on */
  dueDate?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Whether there are other invoices with the same invoice number */
  hasInvoiceNumberDuplicates: Scalars['Boolean']['output'];
  /** Whether the invoice has any payment records with refundable surcharge amounts */
  hasRefundableSurchargePayments: Scalars['Boolean']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** Number of whole days after the issue_date that payment is due */
  invoiceNet?: Maybe<Scalars['Int']['output']>;
  /** The invoice number */
  invoiceNumber: Scalars['String']['output'];
  /** The status of the invoice */
  invoiceStatus: InvoiceStatusTypeEnum;
  /** The date the invoice was issued on */
  issuedDate?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /**
   * A list of job ID's associated with the invoice
   * @deprecated Use `jobs.nodes.id` instead
   */
  jobIds: Array<Scalars['EncodedId']['output']>;
  /** The URI for the given record in Jobber Online */
  jobberWebUri: Scalars['String']['output'];
  /** The jobs related to the invoice */
  jobs: JobConnection;
  /** The line items on the invoice */
  lineItems: InvoiceLineItemConnection;
  /** All messages related to this work object. */
  linkedCommunications: MessageInterfaceConnection;
  /** The message on the invoice */
  message?: Maybe<Scalars['String']['output']>;
  /** The next available date to send an SMS review request */
  nextDateToSendReviewSms?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /**
   * The non-tax amount on the invoice
   * @deprecated All amounts related information are now included in the field `amounts`, please use the `amounts` field instead
   */
  nonTaxAmount: Scalars['Float']['output'];
  /** The note files attached to the invoice */
  noteAttachments: InvoiceNoteFileConnection;
  /** The notes attached to the invoice */
  notes: InvoiceNoteUnionConnection;
  /** The payment records applied to the invoice */
  paymentRecords: PaymentRecordConnection;
  /**
   * The total payments payed on the invoice
   * @deprecated All amounts related information are now included in the field `amounts`, please use the `amounts` field instead
   */
  paymentsTotal: Scalars['Float']['output'];
  /** The properties related to the invoice */
  properties: PropertyConnection;
  /**
   * A list of property ID's associated with the invoice
   * @deprecated Use `properties.nodes.id` instead
   */
  propertyIds: Array<Scalars['EncodedId']['output']>;
  /** The date the invoice was received on */
  receivedDate?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Salesperson for the invoice */
  salesperson?: Maybe<User>;
  /** The subject of the invoice */
  subject: Scalars['String']['output'];
  /**
   * The subtotal of the invoice
   * @deprecated All amounts related information are now included in the field `amounts`, please use the `amounts` field instead
   */
  subtotal: Scalars['Float']['output'];
  /**
   * The status of the object for an accounting sync
   * @deprecated Our QBO sync is changing. This value will change.
   */
  syncStatus: Scalars['String']['output'];
  /**
   * The percentage of tax on the invoice
   * @deprecated All tax_rate related information are now included in the field `tax_rate`, please use the `tax_rate` field instead
   */
  tax: Scalars['Float']['output'];
  /**
   * The tax amount on the invoice
   * @deprecated All amounts related information are now included in the field `amounts`, please use the `amounts` field instead
   */
  taxAmount: Scalars['Float']['output'];
  /** The tax calculation method on the invoice */
  taxCalculationMethod: Scalars['String']['output'];
  /** The tax rate and amount details */
  taxDetails?: Maybe<TaxDetails>;
  /** The tax rate information on the invoice */
  taxRate?: Maybe<TaxRate>;
  /**
   * The name of the tax rate set on the invoice
   * @deprecated All tax_rate related information are now included in the field `tax_rate`, please use the `tax_rate` field instead
   */
  taxRateName: Scalars['String']['output'];
  /**
   * The total cost of the invoice
   * @deprecated All amounts related information are now included in the field `amounts`, please use the `amounts` field instead
   */
  total: Scalars['Float']['output'];
  /**
   * A list of transaction ID's associated with the invoice
   * @deprecated Use `transactions.nodes.id` instead
   */
  transactionIds: Array<Scalars['EncodedId']['output']>;
  /** The last time the invoice was changed in a way that is meaningful to the Service Provider */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** The visits associated with the invoice */
  visits: VisitConnection;
  /** Whether the invoice is waiting for a financed payment */
  waitingForFinancedPayment: Scalars['Boolean']['output'];
};


/** A request for payment which Service Providers send to their clients after the work is done */
export type InvoiceArchivedJobsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A request for payment which Service Providers send to their clients after the work is done */
export type InvoiceJobsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A request for payment which Service Providers send to their clients after the work is done */
export type InvoiceLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A request for payment which Service Providers send to their clients after the work is done */
export type InvoiceLinkedCommunicationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A request for payment which Service Providers send to their clients after the work is done */
export type InvoiceNoteAttachmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<NoteAttachmentFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<NoteAttachmentSortAttributes>>;
};


/** A request for payment which Service Providers send to their clients after the work is done */
export type InvoiceNotesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<NotesSortInput>>;
};


/** A request for payment which Service Providers send to their clients after the work is done */
export type InvoicePaymentRecordsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<PaymentRecordFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A request for payment which Service Providers send to their clients after the work is done */
export type InvoicePropertiesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A request for payment which Service Providers send to their clients after the work is done */
export type InvoiceVisitsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** All amounts related to an invoice */
export type InvoiceAmounts = {
  __typename?: 'InvoiceAmounts';
  /** The deposit amount */
  depositAmount: Scalars['Float']['output'];
  /** The discount amount */
  discountAmount: Scalars['Float']['output'];
  /** The invoice balance after all payments */
  invoiceBalance: Scalars['Float']['output'];
  /** The computed discount amount applied to the invoice subtotal */
  legacyDiscountAmount: Scalars['Float']['output'];
  /** The non-tax amount including the line items which are exempted from the tax */
  nonTaxAmount: Scalars['Float']['output'];
  /** The total payments payed on the invoice */
  paymentsTotal: Scalars['Float']['output'];
  /** The subtotal including line item costs but excluding tax amounts */
  subtotal: Scalars['Float']['output'];
  /** The tax amount */
  taxAmount: Scalars['Float']['output'];
  /** The sum of all tips paid to an invoice */
  tipsTotal: Scalars['Float']['output'];
  /** The total cost of the invoice or quote, including line item costs and tax amounts */
  total: Scalars['Float']['output'];
};

/** Billing address associated with an invoice */
export type InvoiceBillingAddress = AddressInterface & {
  __typename?: 'InvoiceBillingAddress';
  /** The city of the address */
  city?: Maybe<Scalars['String']['output']>;
  /** The point coordinates of the address if it has been geo-coded */
  coordinates?: Maybe<GeoPoint>;
  /** The country of the address */
  country?: Maybe<Scalars['String']['output']>;
  /** The status of geo-locating the coordinates for an address */
  geoStatus?: Maybe<GeoStatus>;
  /** The name of the property for the address */
  name?: Maybe<Scalars['String']['output']>;
  /** The postal code of the address */
  postalCode?: Maybe<Scalars['String']['output']>;
  /** The province of the address */
  province?: Maybe<Scalars['String']['output']>;
  /** The street address */
  street: Scalars['String']['output'];
  /** The first line of the street address */
  street1?: Maybe<Scalars['String']['output']>;
  /** The second line of the street address */
  street2?: Maybe<Scalars['String']['output']>;
};

/** Input arguments for a client's view option settings for an invoice */
export type InvoiceClientViewOptionsInput = {
  /** Setting to show the account balance */
  showAccountBalance?: InputMaybe<Scalars['Boolean']['input']>;
  /** Setting to show the late stamp */
  showLateStamp?: InputMaybe<Scalars['Boolean']['input']>;
  /** Setting to show the client invoice line item quantities */
  showLineItemQty?: InputMaybe<Scalars['Boolean']['input']>;
  /** Setting to show the client invoice line item total costs */
  showLineItemTotalCosts?: InputMaybe<Scalars['Boolean']['input']>;
  /** Setting to show the client invoice line item unit costs */
  showLineItemUnitCosts?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Input for closing an invoice */
export type InvoiceCloseInput = {
  /** Option to close the invoice */
  closeOption: InvoiceCloseOptionsType;
};

/** Options for closing an invoice */
export type InvoiceCloseOptionsType =
  /** Mark the invoice as bad debt */
  | 'BAD_DEBT'
  /** Mark the invoice as received without recording a payment */
  | 'MARK_RECEIVED';

/** Autogenerated return type of InvoiceClose. */
export type InvoiceClosePayload = {
  __typename?: 'InvoiceClosePayload';
  /** The closed invoice */
  invoice?: Maybe<Invoice>;
  /** Errors encountered when closing the invoice */
  userErrors: Array<MutationErrors>;
};

/** The connection type for Invoice. */
export type InvoiceConnection = {
  __typename?: 'InvoiceConnection';
  /** A list of edges. */
  edges?: Maybe<Array<InvoiceEdge>>;
  /** A list of nodes. */
  nodes: Array<Invoice>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** Attributes for creating a new invoice */
export type InvoiceCreateInput = {
  /** Whether ach payments are allowed on the invoice */
  allowClientHubAchPayments?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether credit card payments are allowed on the invoice */
  allowClientHubCreditCardPayments?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether partial payments are allowed on an invoice */
  allowPartialPayments?: InputMaybe<Scalars['Boolean']['input']>;
  /** Toggle whether to send a review request SMS */
  allowReviewRequest?: InputMaybe<Scalars['Boolean']['input']>;
  /** The ID of the client the invoice is made for */
  clientId: Scalars['EncodedId']['input'];
  /** Per-invoice client view settings */
  clientViewOptions?: InputMaybe<InvoiceClientViewOptionsInput>;
  /** The contract disclaimer for the invoice */
  contractDisclaimer?: InputMaybe<Scalars['String']['input']>;
  /** List of custom fields to add */
  customFields?: InputMaybe<Array<CustomFieldCreateInput>>;
  /** A list of unique identifiers of the deposits associated with the job to create an invoice from */
  depositIds?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** The discount associated with the invoice */
  discount?: InputMaybe<DiscountInput>;
  /** The due date and type of the invoice */
  dueDetails: InvoiceDueDetails;
  /** The invoice number */
  invoiceNumber?: InputMaybe<Scalars['String']['input']>;
  /** The date the invoice was issued on */
  issuedDate?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
  /** The unique identifier of the job to create an invoice from */
  jobId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The unique identifier of the jobs to be associated with this invoice */
  jobIds?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** The line items associated with the invoice */
  lineItems: Array<InvoiceCreationLineItemInput>;
  /** Mark the invoice as sent (changes status from draft to sent) */
  markSent?: InputMaybe<Scalars['Boolean']['input']>;
  /** The message on the invoice */
  message?: InputMaybe<Scalars['String']['input']>;
  /** The notes to be added to the invoice */
  notes?: InputMaybe<Array<InvoiceCreateNoteInput>>;
  /** The ID of the payment term to apply to the invoice. Copies the payment term details (days, term type, label) to the invoice fields. */
  paymentTermId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The ID of the property for the invoice. Can only be provided for invoices without jobs. */
  propertyId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The referral incentive ID to apply to the invoice */
  referralIncentiveId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The salesperson for this invoice */
  salespersonId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The scheduled invoice ID to apply to the invoice */
  scheduledInvoiceId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** If true and paymentTermId is supplied, sets the payment term as the client's default */
  setPaymentTermAsClient?: InputMaybe<Scalars['Boolean']['input']>;
  /** The subject line of the invoice */
  subject?: InputMaybe<Scalars['String']['input']>;
  /** The tax associated with the invoice */
  tax: TaxInputType;
  /** The tracking source */
  trackingSource?: InputMaybe<Scalars['String']['input']>;
  /** The unique identifier of the visits to create an invoice from */
  visitIds?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
};

/** Attributes for creating invoice notes */
export type InvoiceCreateNoteInput = {
  /** List of attachments to be added to the note */
  attachments?: InputMaybe<Array<NoteAttachmentAttributes>>;
  /** The message to be placed on the note */
  message?: InputMaybe<Scalars['String']['input']>;
  /** Whether the note should be pinned */
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Autogenerated return type of InvoiceCreateNote. */
export type InvoiceCreateNotePayload = {
  __typename?: 'InvoiceCreateNotePayload';
  /** The invoice the note is attached to */
  invoice?: Maybe<Invoice>;
  /** The newly created note */
  invoiceNote?: Maybe<InvoiceNote>;
  /** Errors encountered during note creation */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of InvoiceCreate. */
export type InvoiceCreatePayload = {
  __typename?: 'InvoiceCreatePayload';
  /** The newly created invoice */
  invoice?: Maybe<Invoice>;
  /** Errors encountered when creating the invoice */
  userErrors: Array<MutationErrors>;
};

/** Input for creating a new line item on a new invoice */
export type InvoiceCreationLineItemInput = {
  /** The type of line item */
  category?: InputMaybe<ProductsAndServicesCategory>;
  /** The total cost of the line item (not cost per unit) */
  cost?: InputMaybe<Scalars['Float']['input']>;
  /** The service date of the line item */
  date?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
  /** The description of the line item */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The unique ID of the job line item to be linked to the invoice line item */
  jobLineItemId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The name of the line item */
  name: Scalars['String']['input'];
  /** The unique identifier of the linked product or service */
  productOrServiceId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The quantity of the line item */
  quantity?: InputMaybe<Scalars['Float']['input']>;
  /** Is the line item taxable */
  taxable?: InputMaybe<Scalars['Boolean']['input']>;
};

/** When the full payment of the invoice is due */
export type InvoiceDueDetails = {
  /** The date the invoice is due on */
  dueDate?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
  /** The amount of days the invoice is due after it was issued */
  invoiceNet?: InputMaybe<Scalars['Int']['input']>;
};

/** An edge in a connection. */
export type InvoiceEdge = {
  __typename?: 'InvoiceEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Invoice;
};

/** Attributes for editing an invoice */
export type InvoiceEditInput = {
  /** Whether to allow ach payments or not */
  allowClientHubAchPayments?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether to allow credit card payments or not */
  allowClientHubCreditCardPayments?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether partial payments are allowed on an invoice */
  allowPartialPayments?: InputMaybe<Scalars['Boolean']['input']>;
  /** Toggle whether to send a review request SMS */
  allowReviewRequest?: InputMaybe<Scalars['Boolean']['input']>;
  /** Per-invoice client view settings */
  clientViewOptions?: InputMaybe<InvoiceClientViewOptionsInput>;
  /** The contract disclaimer for the invoice */
  contractDisclaimer?: InputMaybe<Scalars['String']['input']>;
  /** List of custom fields to modify or add */
  customFields?: InputMaybe<Array<CustomFieldEditInput>>;
  /** The discount applied to this invoice. To remove the discount, set the rate to 0. */
  discount?: InputMaybe<DiscountInput>;
  /** The due date and net of the invoice */
  dueDetails?: InputMaybe<InvoiceDueDetails>;
  /** The invoice number */
  invoiceNumber?: InputMaybe<Scalars['String']['input']>;
  /** The date the invoice was issued on */
  issuedDate?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
  /** The message on the invoice */
  message?: InputMaybe<Scalars['String']['input']>;
  /** The ID of the payment term to apply to the invoice. Copies the payment term details (days, term type, label) to the invoice fields. */
  paymentTermId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The ID of the property for the invoice. Can only be set for invoices without jobs. */
  propertyId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The salesperson for this invoice */
  salespersonId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** If true and paymentTermId is supplied, sets the payment term as the client's default */
  setPaymentTermAsClient?: InputMaybe<Scalars['Boolean']['input']>;
  /** The subject of the invoice */
  subject?: InputMaybe<Scalars['String']['input']>;
  /** The id of tax on the invoice */
  taxRateId?: InputMaybe<Scalars['EncodedId']['input']>;
};

/** Attributes for editing an existing invoice note */
export type InvoiceEditNoteInput = {
  /** List of attachments to append to the note */
  attachmentsToAdd?: InputMaybe<Array<NoteAttachmentAttributes>>;
  /** List of attachments to delete from the note */
  attachmentsToDelete?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** The new message to place on the note */
  message?: InputMaybe<Scalars['String']['input']>;
  /** The unique identifier of the note */
  noteId: Scalars['EncodedId']['input'];
  /** Whether the note should be pinned */
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Autogenerated return type of InvoiceEditNote. */
export type InvoiceEditNotePayload = {
  __typename?: 'InvoiceEditNotePayload';
  /** The invoice the note is attached to */
  invoice?: Maybe<Invoice>;
  /** The edited note */
  invoiceNote?: Maybe<InvoiceNote>;
  /** Errors encountered during note edit */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of InvoiceEdit. */
export type InvoiceEditPayload = {
  __typename?: 'InvoiceEditPayload';
  /** The edited invoice */
  invoice?: Maybe<Invoice>;
  /** The errors returned on mutation failure */
  userErrors: Array<MutationErrors>;
};

/** Attributes for filtering invoices */
export type InvoiceFilterAttributes = {
  /** The encoded id of the client to filter by */
  clientId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The created date filter by */
  createdAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The due date to filter by */
  dueDate?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** An array of origin(s) of the invoice to exclude */
  excludeOrigin?: InputMaybe<Array<InvoiceOrigin>>;
  /** The invoice number to filter by */
  invoiceNumber?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The issued date to filter by */
  issuedDate?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The status to filter by */
  status?: InputMaybe<InvoiceStatusTypeEnum>;
  /** The total to filter by */
  total?: InputMaybe<FloatRangeInput>;
  /** The updated date to filter by */
  updatedAt?: InputMaybe<Iso8601DateTimeRangeInput>;
};

/** An invoice line item */
export type InvoiceLineItem = LineItemInterface & {
  __typename?: 'InvoiceLineItem';
  /** The category of the line item */
  category: ProductsAndServicesCategory;
  /**
   * The price of the line item
   * @deprecated Use `total_price` instead
   */
  cost: Scalars['Float']['output'];
  /** The DateTime the line item was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The date of service associated with this line item */
  date?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The description of the line item */
  description: Scalars['String']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The associated job line item if this invoice line item was created from a job */
  jobLineItem?: Maybe<JobLineItem>;
  /** The product or service from the Service Providers saved Products and Services list that was used to create this line item */
  linkedProductOrService?: Maybe<ProductOrService>;
  /** The name of the line item */
  name: Scalars['String']['output'];
  /** The original cost of the line item before any progress invoicing adjustments */
  originalCost?: Maybe<Scalars['Float']['output']>;
  /**
   * The quantity of the line item
   * @deprecated Use `quantity` field
   */
  qty: Scalars['Float']['output'];
  /** The quantity of the line item */
  quantity: Scalars['Float']['output'];
  /** The tax rate type of the line item */
  taxRate: TaxRate;
  /** If the line item is taxable */
  taxable: Scalars['Boolean']['output'];
  /** The total price of the line item */
  totalPrice: Scalars['Float']['output'];
  /** The unit price of the line item */
  unitPrice: Scalars['Float']['output'];
  /** The last DateTime the line item was changed in a way that is meaningful to the Service Provider */
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

/** The connection type for InvoiceLineItem. */
export type InvoiceLineItemConnection = {
  __typename?: 'InvoiceLineItemConnection';
  /** A list of edges. */
  edges?: Maybe<Array<InvoiceLineItemEdge>>;
  /** A list of nodes. */
  nodes: Array<InvoiceLineItem>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type InvoiceLineItemEdge = {
  __typename?: 'InvoiceLineItemEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: InvoiceLineItem;
};

/** Autogenerated return type of InvoiceMarkAsSent. */
export type InvoiceMarkAsSentPayload = {
  __typename?: 'InvoiceMarkAsSentPayload';
  /** The updated invoice */
  invoice?: Maybe<Invoice>;
  /** Errors encountered when marking the invoice as sent */
  userErrors: Array<MutationErrors>;
};

/** An invoice note */
export type InvoiceNote = NoteInterface & {
  __typename?: 'InvoiceNote';
  /** When the note was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The user or app that created the note */
  createdBy?: Maybe<NoteCreatedByUnion>;
  /** The attached note files */
  fileAttachments: NoteFileInterfaceConnection;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** When the note was last updated by a user */
  lastEditedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The last user to edit the note */
  lastEditedBy?: Maybe<User>;
  /** What objects (client, quote, job, etc.) the note is linked to */
  linkedTo: NoteLink;
  /** The note message */
  message: Scalars['String']['output'];
  /** Whether the note is pinned */
  pinned: Scalars['Boolean']['output'];
};


/** An invoice note */
export type InvoiceNoteFileAttachmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<NoteAttachmentFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<NoteAttachmentSortAttributes>>;
};

/** A file attached to a note */
export type InvoiceNoteFile = NoteFileInterface & {
  __typename?: 'InvoiceNoteFile';
  /** The type of the file */
  contentType: Scalars['String']['output'];
  /** The time the note file attachment was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The name of the file */
  fileName: Scalars['String']['output'];
  /** The size of the file in bytes */
  fileSize: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The note this attachment is attached to */
  note: InvoiceNoteUnion;
  /** The possible statuses for the file */
  status: NoteFileStatusEnum;
  /** The location of the thumbnail */
  thumbnailUrl: Scalars['String']['output'];
  /** The time the note file attachment was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** The location of the file */
  url: Scalars['String']['output'];
};

/** The connection type for InvoiceNoteFile. */
export type InvoiceNoteFileConnection = {
  __typename?: 'InvoiceNoteFileConnection';
  /** A list of edges. */
  edges?: Maybe<Array<InvoiceNoteFileEdge>>;
  /** A list of nodes. */
  nodes: Array<InvoiceNoteFile>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type InvoiceNoteFileEdge = {
  __typename?: 'InvoiceNoteFileEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: InvoiceNoteFile;
};

export type InvoiceNoteUnion = ClientNote | InvoiceNote | JobNote | QuoteNote | RequestNote;

/** The connection type for InvoiceNoteUnion. */
export type InvoiceNoteUnionConnection = {
  __typename?: 'InvoiceNoteUnionConnection';
  /** A list of edges. */
  edges?: Maybe<Array<InvoiceNoteUnionEdge>>;
  /** A list of nodes. */
  nodes: Array<InvoiceNoteUnion>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type InvoiceNoteUnionEdge = {
  __typename?: 'InvoiceNoteUnionEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: InvoiceNoteUnion;
};

export type InvoiceOrigin =
  | 'AUTOMATIC_PAYMENT'
  | 'BATCH_INVOICE'
  | 'IMPORT'
  | 'INTEGRATIONS'
  | 'JOB_CLOSE_JOBBER_ONLINE'
  | 'JOB_CLOSE_MOBILE'
  | 'MODULAR_ONBOARDING_MOBILE'
  | 'NEW_JOBBER_ONLINE'
  | 'NEW_MOBILE'
  | 'QUOTE_CONVERT_MOBILE'
  | 'VISIT_CLOSE_JOBBER_ONLINE'
  | 'VISIT_CLOSE_MOBILE'
  | 'WISETACK';

/** A payment record allocation associated with an invoice */
export type InvoicePaymentRecordAllocation = PaymentRecordAllocationInterface & {
  __typename?: 'InvoicePaymentRecordAllocation';
  /** The allocation amount */
  amount: Scalars['Float']['output'];
  /** The invoice associated with this payment record allocation */
  invoice: Invoice;
};

/** Autogenerated return type of InvoiceReopen. */
export type InvoiceReopenPayload = {
  __typename?: 'InvoiceReopenPayload';
  /** The updated invoice */
  invoice?: Maybe<Invoice>;
  /** Errors encountered when re-opening the invoice */
  userErrors: Array<MutationErrors>;
};

/** Invoice schedule detailed information */
export type InvoiceSchedule = {
  __typename?: 'InvoiceSchedule';
  /** Frequency type for invoicing the job */
  billingFrequency: BillingFrequencyEnum;
  /** Recurrence details */
  recurrenceSchedule?: Maybe<RecurrenceSchedule>;
  /** Friendly string of invoicing frequency */
  scheduleSummary: Scalars['String']['output'];
};

/** The attributes to sort on a collection of invoices */
export type InvoiceSortInput = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The key to sort on */
  key: InvoiceSortKey;
};

/** The fields, or associated fields, on a collection of invoices which support sorting functionality */
export type InvoiceSortKey =
  /** The field which shows the client first name associated to the invoice */
  | 'CLIENT_FIRST_NAME'
  /** The field which shows the client last name associated to the invoice */
  | 'CLIENT_LAST_NAME'
  /** The field which shows the client last name or company name associated to the invoice */
  | 'CLIENT_PRIMARY_NAME'
  /** The field which shows the date the invoice was created */
  | 'CREATED_AT'
  /** The field which shows the date the invoice is due */
  | 'DUE_DATE'
  /** The field which shows the outstanding balance of the invoice */
  | 'INVOICE_BALANCE'
  /** The field which shows the deposit amount paid to the invoice */
  | 'INVOICE_DEPOSIT_AMOUNT'
  /** The field which shows the discount amount on the invoice */
  | 'INVOICE_DISCOUNT_AMOUNT'
  /** The field which shows the invoice number */
  | 'INVOICE_NUMBER'
  /** The field which shows the invoice status */
  | 'INVOICE_STATUS'
  /** The field which shows the invoice status */
  | 'INVOICE_STATUS_AND_DUE_DATE_AND_NUMBER'
  /** The field which shows the tax amount of the invoice */
  | 'INVOICE_TAX_AMOUNT'
  /** The field which shows the tax percent of the invoice */
  | 'INVOICE_TAX_PERCENT'
  /** The field which shows the total tips paid to the invoice */
  | 'INVOICE_TIP_TOTAL'
  /** The field which shows the total of the invoice */
  | 'INVOICE_TOTAL'
  /** The field which shows the date the invoice was issued */
  | 'ISSUED_DATE'
  /** The field which shows the date the invoice was marked paid */
  | 'RECEIVED_DATE'
  /** The field which shows the date the invoice was last updated */
  | 'UPDATED_AT';

export type InvoiceStatusTypeEnum =
  /** awaiting_payment */
  | 'awaiting_payment'
  /** bad_debt */
  | 'bad_debt'
  /** draft */
  | 'draft'
  /** paid */
  | 'paid'
  /** past_due */
  | 'past_due'
  /** Status for invoices that are awaiting payment but are not yet due. */
  | 'sent_not_due';

/** Autogenerated return type of InvoiceUnmarkBadDebt. */
export type InvoiceUnmarkBadDebtPayload = {
  __typename?: 'InvoiceUnmarkBadDebtPayload';
  /** The updated invoice */
  invoice?: Maybe<Invoice>;
  /** Errors encountered when unmarking the invoice as bad debt */
  userErrors: Array<MutationErrors>;
};

/** Select a range of ISO8601DateTime, use either `eq` or `min` and `max`, but not both. `min` or `max` can be `null` when used together to expand the range infinitely */
export type Iso8601DateTimeRangeInput = {
  /** The after date in ISO8601DateTime format to select */
  after?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
  /** The before date in ISO8601DateTime format to select */
  before?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
  /** The exact date in ISO8601DateTime format to select */
  eq?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
};

/** A detailed contract of work which Service Providers use to schedule work for a Service Consumer */
export type Job = CustomFieldsInterface & {
  __typename?: 'Job';
  /** Allow SMS to be sent to client for Google Reviews feature */
  allowReviewRequest: Scalars['Boolean']['output'];
  /** The time window during which the SP can arrive at the job */
  arrivalWindow?: Maybe<ArrivalWindow>;
  /** Invoicing strategy selected for the job */
  billingType: BillingStrategy;
  /** The time when booking confirmation for the job was sent */
  bookingConfirmationSentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The client on the job */
  client: Client;
  /** Count of completed visits that have not been invoiced. Only relevant for visit-based billing jobs. */
  completedAndUninvoicedVisitsCount: Scalars['Int']['output'];
  /** The total dollar value of completed visits that have not been invoiced. Only relevant for visit-based billing jobs; returns 0 for fixed-price jobs. */
  completedAndUninvoicedVisitsTotal: Scalars['Float']['output'];
  /** The completion date of the job */
  completedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The time the job was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The custom fields set for this object */
  customFields: Array<CustomFieldUnion>;
  /** The default title for new visits */
  defaultVisitTitle: Scalars['String']['output'];
  /** End date of the job */
  endAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Expenses associated with the job */
  expenses: ExpenseConnection;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /**
   * Users assigned at time of job creation. This may differ from users assigned to the job's visits
   * @deprecated Use visitSchedule.assignedTo
   */
  initialAssignedUsers: UserConnection;
  /** The instructions on a job */
  instructions?: Maybe<Scalars['String']['output']>;
  /** Schedule of invoices */
  invoiceSchedule: InvoiceSchedule;
  /** The total invoiced amount of the job */
  invoicedTotal: Scalars['Float']['output'];
  /** The invoices associated with the job */
  invoices: InvoiceConnection;
  /** The total and outstanding balance of the job based on invoice and quote deposits */
  jobBalanceTotals?: Maybe<JobBalanceTotals>;
  /** The job costing fields representing the profitability of the job */
  jobCosting?: Maybe<JobCosting>;
  /** The number of the job */
  jobNumber: Scalars['Int']['output'];
  /** The status of the job */
  jobStatus: JobStatusTypeEnum;
  /** The type of job */
  jobType: JobTypeTypeEnum;
  /** The URI for the given record in Jobber Online */
  jobberWebUri: Scalars['String']['output'];
  /** The line items associated with the job */
  lineItems: JobLineItemConnection;
  /** The next available date to send an SMS review request */
  nextDateToSendReviewSms?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The note files attached to the job */
  noteAttachments: JobNoteFileConnection;
  /** The notes attached to the job */
  notes: JobNoteUnionConnection;
  /** The payment records applied to this job's invoices */
  paymentRecords: PaymentRecordConnection;
  /** The property associated with the job */
  property: Property;
  /** When applicable, the quote associated with the job */
  quote?: Maybe<Quote>;
  /** When applicable, the request associated with the job */
  request?: Maybe<Request>;
  /** Salesperson for the job */
  salesperson?: Maybe<User>;
  /** The originating source of the job */
  source: Source;
  /** Start date of the job */
  startAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** A list of all timesheet entries for this job */
  timeSheetEntries: TimeSheetEntryConnection;
  /** The scheduling information of the job */
  title?: Maybe<Scalars['String']['output']>;
  /** The total chargeable amount of the job */
  total: Scalars['Float']['output'];
  /** The total uninvoiced amount of the job */
  uninvoicedTotal: Scalars['Float']['output'];
  /** The last time the job was changed in a way that is meaningful to the Service Provider */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** Schedule of visits */
  visitSchedule: VisitSchedule;
  /** The scheduled or unscheduled visits to the customer's property to complete the work associated with this job */
  visits: VisitConnection;
  /** Information about jobs visits */
  visitsInfo: VisitsInfo;
  /** The setting for automatic invoice charges */
  willClientBeAutomaticallyCharged?: Maybe<Scalars['Boolean']['output']>;
};


/** A detailed contract of work which Service Providers use to schedule work for a Service Consumer */
export type JobExpensesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A detailed contract of work which Service Providers use to schedule work for a Service Consumer */
export type JobInitialAssignedUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A detailed contract of work which Service Providers use to schedule work for a Service Consumer */
export type JobInvoicesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<InvoiceSortInput>>;
};


/** A detailed contract of work which Service Providers use to schedule work for a Service Consumer */
export type JobLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A detailed contract of work which Service Providers use to schedule work for a Service Consumer */
export type JobNoteAttachmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<NoteAttachmentFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<NoteAttachmentSortAttributes>>;
};


/** A detailed contract of work which Service Providers use to schedule work for a Service Consumer */
export type JobNotesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<NotesSortInput>>;
};


/** A detailed contract of work which Service Providers use to schedule work for a Service Consumer */
export type JobPaymentRecordsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A detailed contract of work which Service Providers use to schedule work for a Service Consumer */
export type JobTimeSheetEntriesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A detailed contract of work which Service Providers use to schedule work for a Service Consumer */
export type JobVisitsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<VisitFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<VisitsSortInput>>;
  timezone?: InputMaybe<Scalars['Timezone']['input']>;
};

/** The total and outstanding balance of a job */
export type JobBalanceTotals = {
  __typename?: 'JobBalanceTotals';
  /** The outstanding balance of the job to be paid based off of the invoices */
  outstandingAmount?: Maybe<Scalars['Float']['output']>;
  /** The total balance of the job from the invoices */
  totalAmount?: Maybe<Scalars['Float']['output']>;
};

/** Attributes for closing a job */
export type JobCloseInput = {
  /** What to do with the incomplete visits on the job */
  modifyIncompleteVisitsBy: IncompleteVisitDecisionEnum;
};

/** Autogenerated return type of JobClose. */
export type JobClosePayload = {
  __typename?: 'JobClosePayload';
  /** The closed job */
  job?: Maybe<Job>;
  /** Errors encountered when closing the job */
  userErrors: Array<MutationErrors>;
};

/** The connection type for Job. */
export type JobConnection = {
  __typename?: 'JobConnection';
  /** A list of edges. */
  edges?: Maybe<Array<JobEdge>>;
  /** A list of nodes. */
  nodes: Array<Job>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** The profitability data associated to a Job */
export type JobCosting = {
  __typename?: 'JobCosting';
  /** Total expense cost associated with this job */
  expenseCost: Scalars['Float']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** Total labour cost associated with this job */
  labourCost: Scalars['Float']['output'];
  /** Total labour duration in seconds of the job */
  labourDuration: Scalars['Seconds']['output'];
  /** Total line item cost associated with this job */
  lineItemCost: Scalars['Float']['output'];
  /** Total profit amount associated with this job */
  profitAmount: Scalars['Float']['output'];
  /** Total profit percentage associated with this job */
  profitPercentage?: Maybe<Scalars['Float']['output']>;
  /** Total cost associated with this job */
  totalCost: Scalars['Float']['output'];
  /** Total revenue associated with this job */
  totalRevenue: Scalars['Float']['output'];
};

/** Attributes for creating a new job */
export type JobCreateAttributes = {
  /** Toggle whether to send a review request SMS */
  allowReviewRequest?: InputMaybe<Scalars['Boolean']['input']>;
  /** Job arrival window information */
  arrivalWindow?: InputMaybe<ArrivalWindowAttributes>;
  /** List of custom fields to add */
  customFields?: InputMaybe<Array<CustomFieldCreateInput>>;
  /** The instructions on a job */
  instructions?: InputMaybe<Scalars['String']['input']>;
  /** Job invoicing detailed information */
  invoicing: JobInvoicingAttributes;
  /** The job form ids associated with the job */
  jobFormIds?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** The number of the job */
  jobNumber?: InputMaybe<Scalars['Int']['input']>;
  /** The line items associated with the job */
  lineItems?: InputMaybe<Array<JobCreateLineItemAttributes>>;
  /** The notes to be added to the job */
  notes?: InputMaybe<Array<JobCreateNoteInput>>;
  /** The ID of the property of the client */
  propertyId: Scalars['EncodedId']['input'];
  /** The quote associated with the job */
  quoteId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The request associated with the job */
  requestId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The user/employee who sold this job */
  salespersonId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** Job scheduling detailed information */
  scheduling?: InputMaybe<JobSchedulingAttributes>;
  /** The date on which the job is scheduled to start, as well as its duration */
  timeframe?: InputMaybe<TimeframeAttributes>;
  /** The title of the Job */
  title?: InputMaybe<Scalars['String']['input']>;
  /** The creation origin of the job */
  trackingOrigin?: InputMaybe<Scalars['String']['input']>;
};

/** Attributes for creating a new line item on a job */
export type JobCreateLineItemAttributes = {
  /** The category of the line item */
  category?: InputMaybe<ProductsAndServicesCategory>;
  /** The description of the line item */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The name of the line item */
  name: Scalars['String']['input'];
  /** The unique identifier of the linked product or service */
  productOrServiceId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The quantity of the line item */
  quantity: Scalars['Float']['input'];
  /** The quote line item id related to this line item */
  quoteLineItemId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** Save a copy of the new line item to products and services for future use */
  saveToProductsAndServices: Scalars['Boolean']['input'];
  /** The sort order of the line item */
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
  /** Is the line item taxable */
  taxable?: InputMaybe<Scalars['Boolean']['input']>;
  /** The total price of the line item */
  totalPrice?: InputMaybe<Scalars['Float']['input']>;
  /** The unit cost of the line item */
  unitCost?: InputMaybe<Scalars['Float']['input']>;
  /** The unit price of the line item */
  unitPrice: Scalars['Float']['input'];
};

/** Inputs for creating a new line item on a job */
export type JobCreateLineItemsInput = {
  /** The attributes of the created line items */
  lineItems: Array<JobCreateLineItemAttributes>;
};

/** Autogenerated return type of JobCreateLineItems. */
export type JobCreateLineItemsPayload = {
  __typename?: 'JobCreateLineItemsPayload';
  /** The line items which have been created successfully */
  createdLineItems: Array<JobLineItem>;
  /** The job modified when creating line items */
  job: Job;
  /** Errors encountered when modifying the job */
  userErrors: Array<MutationErrors>;
};

/** Attributes for creating job notes */
export type JobCreateNoteInput = {
  /** List of attachments to be added to the note */
  attachments?: InputMaybe<Array<NoteAttachmentAttributes>>;
  /** Which objects this job note should be linked to */
  linkedTo?: InputMaybe<JobNoteLinkInput>;
  /** The message to be placed on the note */
  message?: InputMaybe<Scalars['String']['input']>;
  /** Whether the note should be pinned */
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Autogenerated return type of JobCreateNote. */
export type JobCreateNotePayload = {
  __typename?: 'JobCreateNotePayload';
  /** The job the note is attached to */
  job?: Maybe<Job>;
  /** The newly created note */
  jobNote?: Maybe<JobNote>;
  /** Errors encountered during note creation */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of JobCreate. */
export type JobCreatePayload = {
  __typename?: 'JobCreatePayload';
  /** The created job */
  job?: Maybe<Job>;
  /** Errors encountered when creating the job */
  userErrors: Array<MutationErrors>;
};

/** Input for removing line items on a job */
export type JobDeleteLineItemsInput = {
  /** The line items to delete */
  lineItemIds: Array<Scalars['EncodedId']['input']>;
};

/** Autogenerated return type of JobDeleteLineItems. */
export type JobDeleteLineItemsPayload = {
  __typename?: 'JobDeleteLineItemsPayload';
  /** The line items which have been deleted successfully */
  deletedLineItems: Array<JobLineItem>;
  /** The job modified when deleting line items */
  job?: Maybe<Job>;
  /** Errors encountered when modifying the job */
  userErrors: Array<MutationErrors>;
};

/** Attributes for deleting an existing job note */
export type JobDeleteNoteInput = {
  /** The unique identifier of the note */
  noteId: Scalars['EncodedId']['input'];
};

/** Autogenerated return type of JobDeleteNote. */
export type JobDeleteNotePayload = {
  __typename?: 'JobDeleteNotePayload';
  /** The deleted note */
  deletedNote?: Maybe<JobNote>;
  /** The job the note is attached to */
  job?: Maybe<Job>;
  /** Errors encountered during note edit */
  userErrors: Array<MutationErrors>;
};

/** An edge in a connection. */
export type JobEdge = {
  __typename?: 'JobEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Job;
};

/** Attributes for updating a job */
export type JobEditInput = {
  /** Toggle whether to send a review request SMS */
  allowReviewRequest?: InputMaybe<Scalars['Boolean']['input']>;
  /** Job arrival window information */
  arrivalWindow?: InputMaybe<ArrivalWindowAttributes>;
  /** List of custom fields to modify or add */
  customFields?: InputMaybe<Array<CustomFieldEditInput>>;
  /** The instructions of a job and instructions on any incomplete visits */
  instructions?: InputMaybe<Scalars['String']['input']>;
  /** Job invoicing detailed information */
  invoicing?: InputMaybe<JobInvoicingAttributes>;
  /** The job form ids associated with the job */
  jobFormIds?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** The number of the job */
  jobNumber?: InputMaybe<Scalars['Int']['input']>;
  /** The salesperson for this job */
  salespersonId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** Job scheduling detailed information */
  scheduling?: InputMaybe<JobSchedulingAttributes>;
  /** Add a signature or modify an existing signature */
  signature?: InputMaybe<SignatureInput>;
  /** Job Timeframe detailed information */
  timeframe?: InputMaybe<TimeframeAttributes>;
  /** The title of the job */
  title?: InputMaybe<Scalars['String']['input']>;
};

/** Attributes for editing a line item on a job */
export type JobEditLineItemAttributes = {
  /** The category of the line item */
  category?: InputMaybe<ProductsAndServicesCategory>;
  /** The description of the line item */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The unique identifier of the line item */
  lineItemId: Scalars['EncodedId']['input'];
  /** The name of the line item */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The unique identifier of the linked product or service */
  productOrServiceId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The quantity of the line item */
  quantity?: InputMaybe<Scalars['Float']['input']>;
  /** Is the line item taxable */
  taxable?: InputMaybe<Scalars['Boolean']['input']>;
  /** The total price of the line item */
  totalPrice?: InputMaybe<Scalars['Float']['input']>;
  /** The internal unit cost of the line item. */
  unitCost?: InputMaybe<Scalars['Float']['input']>;
  /** The unit price of the line item */
  unitPrice?: InputMaybe<Scalars['Float']['input']>;
};

/** Input for editing line items on a job */
export type JobEditLineItemsInput = {
  /** The attributes of the edited line items */
  lineItems: Array<JobEditLineItemAttributes>;
};

/** Autogenerated return type of JobEditLineItems. */
export type JobEditLineItemsPayload = {
  __typename?: 'JobEditLineItemsPayload';
  /** The job modified when editing line items */
  job?: Maybe<Job>;
  /** The edited line items */
  modifiedLineItems?: Maybe<Array<JobLineItem>>;
  /** Errors encountered when modifying the job line items */
  userErrors: Array<MutationErrors>;
};

/** Attributes for editing an existing job note */
export type JobEditNoteInput = {
  /** List of attachments to append to the note */
  attachmentsToAdd?: InputMaybe<Array<NoteAttachmentAttributes>>;
  /** List of attachments to delete from the note */
  attachmentsToDelete?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** Which objects this note should be linked to */
  linkedTo?: InputMaybe<JobNoteLinkInput>;
  /** The new message to place on the note */
  message?: InputMaybe<Scalars['String']['input']>;
  /** The unique identifier of the note */
  noteId: Scalars['EncodedId']['input'];
  /** Whether the note should be pinned */
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Autogenerated return type of JobEditNote. */
export type JobEditNotePayload = {
  __typename?: 'JobEditNotePayload';
  /** The job the note is attached to */
  job?: Maybe<Job>;
  /** The edited note */
  jobNote?: Maybe<JobNote>;
  /** Errors encountered during note edit */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of JobEdit. */
export type JobEditPayload = {
  __typename?: 'JobEditPayload';
  /** The modified job */
  job?: Maybe<Job>;
  /** Errors encountered when modifying the job */
  userErrors: Array<MutationErrors>;
};

/** Attributes for filtering jobs */
export type JobFilterAttributes = {
  /** The completed date to filter by */
  completedAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The created date to filter by */
  createdAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The end date to filter by */
  endAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The ids of the job to filter by */
  ids?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** To whether include unscheduled jobs or not */
  includeUnscheduled?: InputMaybe<Scalars['Boolean']['input']>;
  /** The quote status to filter by */
  jobType?: InputMaybe<JobTypeTypeEnum>;
  /** To only include jobs that can generate an invoice (includes jobs without line items) */
  onlyInvoiceable?: InputMaybe<Scalars['Boolean']['input']>;
  /** The start date to filter by */
  startAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The status of the job to filter by */
  status?: InputMaybe<JobStatusTypeEnum>;
  /** Restricts results to jobs with visits assigned to the specified user. Best used together with visitsScheduledBetween to scope by date range. Can be used standalone to find all jobs with any visit assigned to the user. */
  visitsAssignedToUserId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** Filter jobs whose visit start dates fall within this window. Also used as threshold for visit-based sorting and mostRecentVisitStartAt field (uses the 'before' end of the range). */
  visitsScheduledBetween?: InputMaybe<Iso8601DateTimeRangeInput>;
};

/** Attributes used for invoicing generation */
export type JobInvoicingAttributes = {
  /** The frequency in which the invoicing should be done */
  invoicingSchedule: BillingFrequencyEnum;
  /** The invoicing strategy selected for the job */
  invoicingType: BillingStrategy;
  /** The ICalendarRecurrenceRule that will be used for invoicing */
  recurrence?: InputMaybe<Scalars['ICalendarRule']['input']>;
};

/** A job line item */
export type JobLineItem = LineItemInterface & {
  __typename?: 'JobLineItem';
  /** The category of the line item */
  category: ProductsAndServicesCategory;
  /**
   * The price of the line item
   * @deprecated Use `total_price` instead
   */
  cost: Scalars['Float']['output'];
  /** The DateTime the line item was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The description of the line item */
  description: Scalars['String']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The product or service from the Service Providers saved Products and Services list that was used to create this line item */
  linkedProductOrService?: Maybe<ProductOrService>;
  /** The name of the line item */
  name: Scalars['String']['output'];
  /**
   * The quantity of the line item
   * @deprecated Use `quantity` field
   */
  qty: Scalars['Float']['output'];
  /** The quantity of the line item */
  quantity: Scalars['Float']['output'];
  /** If the line item is taxable */
  taxable: Scalars['Boolean']['output'];
  /** The total (internal) cost of the line item */
  totalCost?: Maybe<Scalars['Float']['output']>;
  /** The total price of the line item */
  totalPrice: Scalars['Float']['output'];
  /** The unit cost of the line item */
  unitCost?: Maybe<Scalars['Float']['output']>;
  /** The unit price of the line item */
  unitPrice: Scalars['Float']['output'];
  /** The last DateTime the line item was changed in a way that is meaningful to the Service Provider */
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

/** The connection type for JobLineItem. */
export type JobLineItemConnection = {
  __typename?: 'JobLineItemConnection';
  /** A list of edges. */
  edges?: Maybe<Array<JobLineItemEdge>>;
  /** A list of nodes. */
  nodes: Array<JobLineItem>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type JobLineItemEdge = {
  __typename?: 'JobLineItemEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: JobLineItem;
};

/** A job note */
export type JobNote = NoteInterface & {
  __typename?: 'JobNote';
  /** When the note was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The user or app that created the note */
  createdBy?: Maybe<NoteCreatedByUnion>;
  /** The attached note files */
  fileAttachments: NoteFileInterfaceConnection;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** When the note was last updated by a user */
  lastEditedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The last user to edit the note */
  lastEditedBy?: Maybe<User>;
  /** What objects (client, quote, job, etc.) the note is linked to */
  linkedTo: NoteLink;
  /** The note message */
  message: Scalars['String']['output'];
  /** Whether the note is pinned */
  pinned: Scalars['Boolean']['output'];
};


/** A job note */
export type JobNoteFileAttachmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<NoteAttachmentFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<NoteAttachmentSortAttributes>>;
};

/** Autogenerated return type of JobNoteAddAttachment. */
export type JobNoteAddAttachmentPayload = {
  __typename?: 'JobNoteAddAttachmentPayload';
  /** The URLs of the newly added attachments which are being processed */
  attachmentsToBeAdded?: Maybe<Array<Scalars['String']['output']>>;
  /** Errors when appending the attachments to the note */
  userErrors: Array<MutationErrors>;
};

/** A file attached to a note */
export type JobNoteFile = NoteFileInterface & {
  __typename?: 'JobNoteFile';
  /** The type of the file */
  contentType: Scalars['String']['output'];
  /** The time the note file attachment was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The name of the file */
  fileName: Scalars['String']['output'];
  /** The size of the file in bytes */
  fileSize: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The note this attachment is attached to */
  note: JobNoteUnion;
  /** The possible statuses for the file */
  status: NoteFileStatusEnum;
  /** The location of the thumbnail */
  thumbnailUrl: Scalars['String']['output'];
  /** The time the note file attachment was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** The location of the file */
  url: Scalars['String']['output'];
};

/** The connection type for JobNoteFile. */
export type JobNoteFileConnection = {
  __typename?: 'JobNoteFileConnection';
  /** A list of edges. */
  edges?: Maybe<Array<JobNoteFileEdge>>;
  /** A list of nodes. */
  nodes: Array<JobNoteFile>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type JobNoteFileEdge = {
  __typename?: 'JobNoteFileEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: JobNoteFile;
};

/** Attributes for linking job notes */
export type JobNoteLinkInput = {
  /** Whether the note should be linked to related invoices */
  invoices?: InputMaybe<Scalars['Boolean']['input']>;
};

export type JobNoteUnion = ClientNote | JobNote | QuoteNote | RequestNote;

/** The connection type for JobNoteUnion. */
export type JobNoteUnionConnection = {
  __typename?: 'JobNoteUnionConnection';
  /** A list of edges. */
  edges?: Maybe<Array<JobNoteUnionEdge>>;
  /** A list of nodes. */
  nodes: Array<JobNoteUnion>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type JobNoteUnionEdge = {
  __typename?: 'JobNoteUnionEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: JobNoteUnion;
};

/** Autogenerated return type of JobOrderLineItems. */
export type JobOrderLineItemsPayload = {
  __typename?: 'JobOrderLineItemsPayload';
  /** The job modified when editing line items */
  job?: Maybe<Job>;
  /** Errors encountered when ordering the job line items */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of JobReopen. */
export type JobReopenPayload = {
  __typename?: 'JobReopenPayload';
  /** The reopened job */
  job?: Maybe<Job>;
  /** Errors encountered when reopening the job */
  userErrors: Array<MutationErrors>;
};

/** Attributes used for visit generation */
export type JobSchedulingAttributes = {
  /** List of user ids assigned to the job and any scheduled visits */
  assignedTo?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** Whether to create visits or not */
  createVisits: Scalars['Boolean']['input'];
  /** The end time of the visit(s), */
  endTime?: InputMaybe<Scalars['ISO8601Time']['input']>;
  /** Should the team be notified? */
  notifyTeam: Scalars['Boolean']['input'];
  /** The ICalendarRecurrenceRule that will be used for scheduling visits. Must be prefixed with 'RRULE:' */
  recurrence?: InputMaybe<Scalars['ICalendarRule']['input']>;
  /** The start time of the visit(s) */
  startTime?: InputMaybe<Scalars['ISO8601Time']['input']>;
  /** Whether created visits are confirmed by client or not */
  visitConfirmationStatus?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The fields, or associated fields, on a collection of jobs which support sorting functionality */
export type JobSortKey =
  /** The field which shows the client first name associated to the job */
  | 'CLIENT_FIRST_NAME'
  /** The field which shows the client primary name */
  | 'CLIENT_PRIMARY_NAME'
  /** The field which shows the job number */
  | 'JOB_NUMBER'
  /** The field which indicates the job status */
  | 'JOB_STATUS'
  /** The next visit date of the job */
  | 'SCHEDULE'
  /** The field which indicates the total cost */
  | 'TOTAL_COST'
  /** The field which indicates when the job was last updated at */
  | 'UPDATED_AT'
  /** The most recent visit start date for the job */
  | 'VISIT_START_DATE';

export type JobStatusTypeEnum =
  /** These are jobs that are still active, but they have no more upcoming visits. You can think of action required like being 'on hold'. Action required is a prompt to either schedule more visits or close the job. */
  | 'action_required'
  /** Active jobs are the jobs in progress (the job is not closed). This includes other statuses (late, today, upcoming, ...). */
  | 'active'
  /** These are closed jobs that no longer need to be invoiced. These are the jobs that you are done with. */
  | 'archived'
  /** Active jobs that are expiring within 30 days. */
  | 'expiring_within_30_days'
  /** Active jobs with a visit pass but was not marked complete. */
  | 'late'
  /**  These are jobs that are still active, but they have no more upcoming visits. You can think of action required like being 'action required'. On hold is a prompt to either schedule more visits or close the job. (alias for action_required) */
  | 'on_hold'
  /** Jobs that are in requires invoicing status have an overdue invoice reminder. This is a prompt to create an invoice for this job. */
  | 'requires_invoicing'
  /** Active jobs with a visit today. */
  | 'today'
  /** These are jobs that have visits created, but the visits have been set up to be scheduled later. */
  | 'unscheduled'
  /** Active jobs with a visit in the future (after today). */
  | 'upcoming';

export type JobTypeTypeEnum =
  /** A one-off job */
  | 'ONE_OFF'
  /** A job with a recurring schedule */
  | 'RECURRING';

export type JobberPaymentTransactionStatus =
  /** Payment has been disputed */
  | 'DISPUTED'
  /** Payment has failed */
  | 'FAILED'
  /** Payment is in dispute */
  | 'IN_DISPUTE'
  /** Payment has been partially refunded */
  | 'PARTIALLY_REFUNDED'
  /** Payment is pending */
  | 'PENDING'
  /** Payment has been refunded */
  | 'REFUNDED'
  /** Payment has processed successfully */
  | 'SUCCEEDED';

/** A Jobber Payments ACH payment applied to a quote or invoice */
export type JobberPaymentsAchPaymentRecord = PaymentRecordInterface & {
  __typename?: 'JobberPaymentsACHPaymentRecord';
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance (absolute value) */
  amount: Scalars['Float']['output'];
  /** The name of the bank that the online payment originated from */
  bankName: Scalars['String']['output'];
  /** Whether the payment can be edited */
  canEdit: Scalars['Boolean']['output'];
  /** The client associated with the payment */
  client?: Maybe<Client>;
  /** Additional details about the payment */
  details?: Maybe<Scalars['String']['output']>;
  /** The device platform used for this payment */
  devicePlatform?: Maybe<DevicePlatform>;
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The amount of fee attached to a Jobber payment */
  feeAmount?: Maybe<Scalars['Float']['output']>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The invoice associated with the payment */
  invoice?: Maybe<Invoice>;
  /** The last 4 digits of the bank account number that the online payment originated from */
  lastDigits: Scalars['String']['output'];
  /** The original payment record which was negated */
  negatedBalanceAdjustment?: Maybe<PaymentRecordInterface>;
  /** Where the payment originated from */
  paymentOrigin?: Maybe<PaymentOrigin>;
  /** The type of payment used, i.e cash, check, Jobber Payments... */
  paymentType?: Maybe<PaymentType>;
  /** The payout associated with the payment record */
  payout?: Maybe<PayoutRecord>;
  /** The quote associated with the deposit payment */
  quote?: Maybe<Quote>;
  /** The raw amount applied against the quote or invoice balance (preserves sign). */
  rawAmount: Scalars['Float']['output'];
  /** If refunded, the DateTime the payment was refunded. */
  refundedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Refunds associated with the payment record */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** The tip percentage the customer selected */
  selectedTipPercentage?: Maybe<Scalars['String']['output']>;
  /** If sent, the DateTime the payment record was sent to client. */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The terminal reader type used for this payment */
  terminalReaderType?: Maybe<TerminalReader>;
  /** The amount of tip attached to a Jobber payment */
  tipAmount?: Maybe<Scalars['Float']['output']>;
  /** The unique transaction for the payment used in an online transaction */
  transactionId: Scalars['String']['output'];
  /** The status of the jobber payment */
  transactionStatus: JobberPaymentTransactionStatus;
};


/** A Jobber Payments ACH payment applied to a quote or invoice */
export type JobberPaymentsAchPaymentRecordAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A Jobber Payments ACH payment applied to a quote or invoice */
export type JobberPaymentsAchPaymentRecordRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** Details on a loan which a Service Provider with a lender */
export type JobberPaymentsCapitalLoan = {
  __typename?: 'JobberPaymentsCapitalLoan';
  /** Amount of advance accepted for loan, in whole currency units (eg. dollars) */
  acceptedAdvanceAmount?: Maybe<Scalars['Float']['output']>;
  /** Where the capital loan offer was accepted from */
  acceptedFrom?: Maybe<CapitalLoanAcceptanceSource>;
  /** The time when the capital loan was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The time when the capital loan was dismissed */
  dismissedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The datetime that the capital loan expires */
  expiresAfter?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The type of financing product */
  financingType?: Maybe<StripeCapitalLoan>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** Whether the loan is the Service Provider's first loan offer */
  initialOffer: Scalars['Boolean']['output'];
  /** Whether the capital financing loan application has initiated, started, but not yet finished */
  initiatedAmplitudeEvent: Scalars['Boolean']['output'];
  /** Amount of fee charged for loan, in whole currency units (eg. dollars) */
  loanFeeAmount?: Maybe<Scalars['Float']['output']>;
  /** The ID of the loan */
  loanId: Scalars['String']['output'];
  /** Amount of advance offered for loan, in whole currency units (eg. dollars) */
  offeredAdvanceAmount?: Maybe<Scalars['Float']['output']>;
  /** Whether the loan is a refill */
  refill: Scalars['Boolean']['output'];
  /** The status of the loan */
  status: Scalars['String']['output'];
  /** The last time the capital loan was changed */
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

/** The connection type for JobberPaymentsCapitalLoan. */
export type JobberPaymentsCapitalLoanConnection = {
  __typename?: 'JobberPaymentsCapitalLoanConnection';
  /** A list of edges. */
  edges?: Maybe<Array<JobberPaymentsCapitalLoanEdge>>;
  /** A list of nodes. */
  nodes: Array<JobberPaymentsCapitalLoan>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type JobberPaymentsCapitalLoanEdge = {
  __typename?: 'JobberPaymentsCapitalLoanEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: JobberPaymentsCapitalLoan;
};

/** A Jobber Payments credit card payment applied to a quote or invoice */
export type JobberPaymentsCreditCardPaymentRecord = PaymentRecordInterface & {
  __typename?: 'JobberPaymentsCreditCardPaymentRecord';
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance (absolute value) */
  amount: Scalars['Float']['output'];
  /** The brand of the credit card used for an online transaction */
  brand: Scalars['String']['output'];
  /** Whether the payment can be edited */
  canEdit: Scalars['Boolean']['output'];
  /** The client associated with the payment */
  client?: Maybe<Client>;
  /** Additional details about the payment */
  details?: Maybe<Scalars['String']['output']>;
  /** The device platform used for this payment */
  devicePlatform?: Maybe<DevicePlatform>;
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The expiry on the card used for an online transaction */
  expiry: Scalars['String']['output'];
  /** The amount of fee attached to a Jobber payment */
  feeAmount?: Maybe<Scalars['Float']['output']>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The invoice associated with the payment */
  invoice?: Maybe<Invoice>;
  /** The last 4 digits on the card used for an online transaction */
  lastDigits: Scalars['String']['output'];
  /** The name on the card used for an online transaction */
  nameOnCard: Scalars['String']['output'];
  /** Card funding type (e.g. credit, debit, prepaid) */
  paymentMethodFunding?: Maybe<Scalars['String']['output']>;
  /** Where the payment originated from */
  paymentOrigin?: Maybe<PaymentOrigin>;
  /** The type of payment used, i.e cash, check, Jobber Payments... */
  paymentType?: Maybe<PaymentType>;
  /** The payout associated with the payment record */
  payout?: Maybe<PayoutRecord>;
  /** The quote associated with the deposit payment */
  quote?: Maybe<Quote>;
  /** The raw amount applied against the quote or invoice balance (preserves sign). */
  rawAmount: Scalars['Float']['output'];
  /** If refunded, the DateTime the payment was refunded. */
  refundedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Refunds associated with the payment record */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** The tip percentage the customer selected */
  selectedTipPercentage?: Maybe<Scalars['String']['output']>;
  /** If sent, the DateTime the payment record was sent to client. */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Surcharge amount in dollars */
  surchargeAmount?: Maybe<Scalars['Float']['output']>;
  /** Tax on surcharge in dollars */
  surchargeTaxAmount?: Maybe<Scalars['Float']['output']>;
  /** The terminal reader type used for this payment */
  terminalReaderType?: Maybe<TerminalReader>;
  /** The amount of tip attached to a Jobber payment */
  tipAmount?: Maybe<Scalars['Float']['output']>;
  /** The unique transaction for the payment used in an online transaction */
  transactionId: Scalars['String']['output'];
  /** The status of the jobber payment */
  transactionStatus: JobberPaymentTransactionStatus;
};


/** A Jobber Payments credit card payment applied to a quote or invoice */
export type JobberPaymentsCreditCardPaymentRecordAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A Jobber Payments credit card payment applied to a quote or invoice */
export type JobberPaymentsCreditCardPaymentRecordRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** Attributes for filtering Jobber Payments payment methods */
export type JobberPaymentsPaymentMethodFilterAttributes = {
  /** The encoded id of the client to filter by */
  clientId: Scalars['EncodedId']['input'];
};

/** A refunded payment */
export type JobberPaymentsRefundPaymentRecord = PaymentRecordInterface & {
  __typename?: 'JobberPaymentsRefundPaymentRecord';
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance (absolute value) */
  amount: Scalars['Float']['output'];
  /** Whether the payment can be edited */
  canEdit: Scalars['Boolean']['output'];
  /** The client associated with the payment */
  client?: Maybe<Client>;
  /** Additional details about the payment */
  details?: Maybe<Scalars['String']['output']>;
  /** The device platform used for this payment */
  devicePlatform?: Maybe<DevicePlatform>;
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The amount of fee attached to a Jobber payment */
  feeAmount?: Maybe<Scalars['Float']['output']>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The invoice associated with the payment */
  invoice?: Maybe<Invoice>;
  /** Where the payment originated from */
  paymentOrigin?: Maybe<PaymentOrigin>;
  /** The type of payment used, i.e cash, check, Jobber Payments... */
  paymentType?: Maybe<PaymentType>;
  /** The quote associated with the deposit payment */
  quote?: Maybe<Quote>;
  /** The raw amount applied against the quote or invoice balance (preserves sign). */
  rawAmount: Scalars['Float']['output'];
  /** If refunded, the DateTime the payment was refunded. */
  refundedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The original payment made that was refunded */
  refundedPaymentRecord?: Maybe<PaymentRecordInterface>;
  /** Refunds associated with the payment */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** The tip percentage the customer selected */
  selectedTipPercentage?: Maybe<Scalars['String']['output']>;
  /** If sent, the DateTime the payment record was sent to client. */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Surcharge amount in dollars (for surcharged payments) */
  surchargeAmount?: Maybe<Scalars['Float']['output']>;
  /** Tax on surcharge in dollars (for surcharged payments) */
  surchargeTaxAmount?: Maybe<Scalars['Float']['output']>;
  /** The terminal reader type used for this payment */
  terminalReaderType?: Maybe<TerminalReader>;
  /** The amount of tip attached to a Jobber payment */
  tipAmount?: Maybe<Scalars['Float']['output']>;
  /** The unique transaction for the payment used in an online transaction */
  transactionId: Scalars['String']['output'];
  /** The status of the jobber payment */
  transactionStatus: JobberPaymentTransactionStatus;
};


/** A refunded payment */
export type JobberPaymentsRefundPaymentRecordAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A refunded payment */
export type JobberPaymentsRefundPaymentRecordRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** The attributes to sort on a collection of jobs */
export type JobsSortInput = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The key to sort on */
  key: JobSortKey;
};

/** Fields for updating the app's last sync date */
export type LastSyncDate = {
  __typename?: 'LastSyncDate';
  /** Payroll app's last sync date information */
  payroll?: Maybe<Scalars['ISO8601DateTime']['output']>;
};

/** Attributes for editing the app's last sync date */
export type LastSyncDateEditInput = {
  /** Timestamp of when the last payroll sync completed */
  payroll: Scalars['ISO8601DateTime']['input'];
};

/** A lien balance Transaction */
export type LienBalanceTransaction = BalanceTransactionInterface & {
  __typename?: 'LienBalanceTransaction';
  /** The date the balance transaction was created */
  created: Scalars['ISO8601DateTime']['output'];
  /** The type of currency used */
  currency: Scalars['String']['output'];
  /** The balance transaction fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The balance transaction gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The balance transaction net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The balance transaction type */
  type?: Maybe<BalanceTransaction>;
};

export type LineItemInterface = {
  /** The category of the line item */
  category: ProductsAndServicesCategory;
  /**
   * The price of the line item
   * @deprecated Use `total_price` instead
   */
  cost: Scalars['Float']['output'];
  /** The DateTime the line item was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The description of the line item */
  description: Scalars['String']['output'];
  /** The ID of the line item */
  id: Scalars['EncodedId']['output'];
  /** The product or service from the Service Providers saved Products and Services list that was used to create this line item */
  linkedProductOrService?: Maybe<ProductOrService>;
  /** The name of the line item */
  name: Scalars['String']['output'];
  /**
   * The quantity of the line item
   * @deprecated Use `quantity` field
   */
  qty: Scalars['Float']['output'];
  /** The quantity of the line item */
  quantity: Scalars['Float']['output'];
  /** If the line item is taxable */
  taxable: Scalars['Boolean']['output'];
  /** The total price of the line item */
  totalPrice: Scalars['Float']['output'];
  /** The unit price of the line item */
  unitPrice: Scalars['Float']['output'];
  /** The last DateTime the line item was changed in a way that is meaningful to the Service Provider */
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

/** Represents the live state of a vehicle */
export type LiveState = {
  __typename?: 'LiveState';
  /** The current position of the vehicle */
  currentPosition: GpsPositionType;
  /** The timestamp when the live state data was last refreshed */
  dataRefreshedAt: Scalars['ISO8601DateTime']['output'];
  /** The direction of the vehicle as a number of degrees (0-360) from north */
  direction: Scalars['Float']['output'];
  /** The current fuel percentage of the vehicle, expressed as a value between 0 and 1 */
  fuelPercentage: Scalars['Float']['output'];
  /** The current speed of the vehicle in km/h */
  speed: Scalars['Float']['output'];
  /** The current starter battery voltage of the vehicle */
  starterBatteryVoltage: Scalars['Float']['output'];
  /** The current status of the vehicle */
  status: VehicleStatus;
  /** The timestamp when the vehicle's status last changed */
  statusChangedAt: Scalars['ISO8601DateTime']['output'];
};

/** Input type for the live state of a vehicle */
export type LiveStateInput = {
  /** The current position of the vehicle */
  currentPosition: GpsPositionInput;
  /** The timestamp for the last data refresh */
  dataRefreshedAt: Scalars['ISO8601DateTime']['input'];
  /** The direction of the vehicle as a number of degrees (0-360) from north */
  direction: Scalars['Float']['input'];
  /** The current fuel percentage of the vehicle, expressed as a value between 0 and 1 */
  fuelPercentage: Scalars['Float']['input'];
  /** The speed of the vehicle in km/h */
  speed: Scalars['Float']['input'];
  /** The current starter battery voltage of the vehicle */
  starterBatteryVoltage: Scalars['Float']['input'];
  /** The status of the vehicle */
  status: VehicleStatus;
  /** The timestamp for when the status was last updated */
  statusChangedAt: Scalars['ISO8601DateTime']['input'];
};

/** Date and Time attributes for inputs */
export type LocalDateTimeAttributes = {
  /** The date for input */
  date: Scalars['ISO8601Date']['input'];
  /** The time for input */
  time?: InputMaybe<Scalars['ISO8601Time']['input']>;
  /** The timezone for input */
  timezone: Scalars['Timezone']['input'];
};

/** The connection type for MessageInterface. */
export type MessageInterfaceConnection = {
  __typename?: 'MessageInterfaceConnection';
  /** A list of edges. */
  edges?: Maybe<Array<MessageInterfaceEdge>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type MessageInterfaceEdge = {
  __typename?: 'MessageInterfaceEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
};

/** A money order payment applied to a quote or invoice */
export type MoneyOrderPaymentRecord = PaymentRecordInterface & {
  __typename?: 'MoneyOrderPaymentRecord';
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance (absolute value) */
  amount: Scalars['Float']['output'];
  /** Whether the payment can be edited */
  canEdit: Scalars['Boolean']['output'];
  /** The client associated with the payment */
  client?: Maybe<Client>;
  /** Additional details about the payment */
  details?: Maybe<Scalars['String']['output']>;
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The invoice associated with the payment */
  invoice?: Maybe<Invoice>;
  /** Where the payment originated from */
  paymentOrigin?: Maybe<PaymentOrigin>;
  /** The type of payment used, i.e cash, check, Jobber Payments... */
  paymentType?: Maybe<PaymentType>;
  /** The quote associated with the deposit payment */
  quote?: Maybe<Quote>;
  /** The raw amount applied against the quote or invoice balance (preserves sign). */
  rawAmount: Scalars['Float']['output'];
  /** Refunds associated with the payment */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** If sent, the DateTime the payment record was sent to client. */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};


/** A money order payment applied to a quote or invoice */
export type MoneyOrderPaymentRecordAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A money order payment applied to a quote or invoice */
export type MoneyOrderPaymentRecordRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** The mutation root of Jobber's GraphQL interface. */
export type Mutation = {
  __typename?: 'Mutation';
  /** Edit app alerts for an account */
  appAlertEdit: AppAlertEditPayload;
  /** Forcefully remove an account from the requesting app */
  appDisconnect: AppDisconnectPayload;
  /** Edit the last sync date */
  appInstanceLastSyncDateEdit: AppInstanceLastSyncDateEditPayload;
  /** Edit the team member assignment for an appointment (task, visit, assessment) */
  appointmentEditAssignment: AppointmentEditAssignmentPayload;
  /** Marks appointment as complete or incomplete */
  appointmentEditCompleteness: AppointmentEditCompletenessPayload;
  /** Edit schedule for any appointment type (task, visit, assessment, event) */
  appointmentEditSchedule: AppointmentEditSchedulePayload;
  /** Mark request assessment as complete */
  assessmentComplete: AssessmentCompletePayload;
  /** Create request assessment */
  assessmentCreate: AssessmentCreatePayload;
  /** Delete request assessment */
  assessmentDelete: AssessmentDeletePayload;
  /** Edit request assessment */
  assessmentEdit: AssessmentEditPayload;
  /** Unmark request assessment as incomplete */
  assessmentUncomplete: AssessmentUncompletePayload;
  /** Archives a client. */
  clientArchive: ClientArchivePayload;
  /** Create a client */
  clientCreate: ClientCreatePayload;
  /** Creates a note on an existing client */
  clientCreateNote: ClientCreateNotePayload;
  /** Deletes a note on an existing client */
  clientDeleteNote: ClientDeleteNotePayload;
  /** Update a client based on the provided ID. */
  clientEdit: ClientEditPayload;
  /** Edits a note on an existing client */
  clientEditNote: ClientEditNotePayload;
  /** Adds an attachment to a note on an existing client */
  clientNoteAddAttachment: ClientNoteAddAttachmentPayload;
  /** Unarchives a client */
  clientUnarchive: ClientUnarchivePayload;
  /** Create multiple clients */
  clientsCreate: ClientsCreatePayload;
  /** Archive many custom field configurations */
  customFieldConfigurationArchive: CustomFieldConfigurationArchivePayload;
  /** Create an area custom field configuration */
  customFieldConfigurationCreateArea: CustomFieldConfigurationCreateAreaPayload;
  /** Create a dropdown custom field configuration */
  customFieldConfigurationCreateDropdown: CustomFieldConfigurationCreateDropdownPayload;
  /** Create a link custom field configuration */
  customFieldConfigurationCreateLink: CustomFieldConfigurationCreateLinkPayload;
  /** Create a numeric custom field configuration */
  customFieldConfigurationCreateNumeric: CustomFieldConfigurationCreateNumericPayload;
  /** Create a text custom field configuration */
  customFieldConfigurationCreateText: CustomFieldConfigurationCreateTextPayload;
  /** Create a true false custom field configuration */
  customFieldConfigurationCreateTrueFalse: CustomFieldConfigurationCreateTrueFalsePayload;
  /** Edit a custom field configuration */
  customFieldConfigurationEdit: CustomFieldConfigurationEditPayload;
  /** Unarchive many custom field configurations */
  customFieldConfigurationUnarchive: CustomFieldConfigurationUnarchivePayload;
  /** Creates an event */
  eventCreate: EventCreatePayload;
  /** Create a new expense */
  expenseCreate: ExpenseCreatePayload;
  /** Delete an expense */
  expenseDelete: ExpenseDeletePayload;
  /** Edit an expense */
  expenseEdit: ExpenseEditPayload;
  /** Close an invoice */
  invoiceClose: InvoiceClosePayload;
  /** Create a new invoice */
  invoiceCreate: InvoiceCreatePayload;
  /** Creates a note on an existing invoice */
  invoiceCreateNote: InvoiceCreateNotePayload;
  /** Edit an invoice */
  invoiceEdit: InvoiceEditPayload;
  /** Edits a note on an existing invoice */
  invoiceEditNote: InvoiceEditNotePayload;
  /** Mark a draft invoice as sent */
  invoiceMarkAsSent: InvoiceMarkAsSentPayload;
  /** Re-open a paid invoice */
  invoiceReopen: InvoiceReopenPayload;
  /** Unmark an invoice as bad debt */
  invoiceUnmarkBadDebt: InvoiceUnmarkBadDebtPayload;
  /** Closes a job */
  jobClose: JobClosePayload;
  /** Create a job */
  jobCreate: JobCreatePayload;
  /** Create line items on a job */
  jobCreateLineItems: JobCreateLineItemsPayload;
  /** Creates a note on an existing job */
  jobCreateNote: JobCreateNotePayload;
  /** Delete line items on a job */
  jobDeleteLineItems: JobDeleteLineItemsPayload;
  /** Deletes a note on an existing job */
  jobDeleteNote: JobDeleteNotePayload;
  /** Update a job based on the provided ID. */
  jobEdit: JobEditPayload;
  /** Edit line items on a job */
  jobEditLineItems: JobEditLineItemsPayload;
  /** Edits a note on an existing job */
  jobEditNote: JobEditNotePayload;
  /** Adds an attachment to a note on an existing job */
  jobNoteAddAttachment: JobNoteAddAttachmentPayload;
  /** Order line items on a job */
  jobOrderLineItems: JobOrderLineItemsPayload;
  /** Reopen a job based on the provided ID. */
  jobReopen: JobReopenPayload;
  /** Create an on my way tracking link */
  onMyWayTrackingLinkCreate: OnMyWayTrackingLinkCreatePayload;
  /** Create a new product or service */
  productsAndServicesCreate: CreatePayload;
  /** Updates a product or service */
  productsAndServicesEdit: EditPayload;
  /** Creates a new Property for an existing client */
  propertyCreate: PropertyCreatePayload;
  /** Modify an existing property */
  propertyEdit: PropertyEditPayload;
  /** Create a new Quote */
  quoteCreate: QuoteCreatePayload;
  /** Create a line item on a quote */
  quoteCreateLineItems: QuoteCreateLineItemsPayload;
  /** Create a note on a quote */
  quoteCreateNote: QuoteCreateNotePayload;
  /** Create a text line item on a quote */
  quoteCreateTextLineItems: QuoteCreateTextLineItemsPayload;
  /** Delete line items on a quote */
  quoteDeleteLineItems: QuoteDeleteLineItemsPayload;
  /** Edit a quote */
  quoteEdit: QuoteEditPayload;
  /** Edit a line item on a quote */
  quoteEditLineItems: QuoteEditLineItemsPayload;
  /** Edit a note on a quote */
  quoteEditNote: QuoteEditNotePayload;
  /** Archive the given request */
  requestArchive: RequestArchivePayload;
  /** Create a request */
  requestCreate: RequestCreatePayload;
  /** Add line items to a request */
  requestCreateLineItems: RequestCreateLineItemsPayload;
  /** Creates a note on an existing request */
  requestCreateNote: RequestCreateNotePayload;
  /** Delete line items from a request */
  requestDeleteLineItems: RequestDeleteLineItemsPayload;
  /** Edit a request */
  requestEdit: RequestEditPayload;
  /** Attach or detach form templates on a request */
  requestEditJobForms: RequestEditJobFormsPayload;
  /** Edit line items on a request */
  requestEditLineItems: RequestEditLineItemsPayload;
  /** Edits a note on an existing request */
  requestEditNote: RequestEditNotePayload;
  /** Unarchive the given request */
  requestUnarchive: RequestUnarchivePayload;
  /** Retries processing for a failed supplier invoice document */
  supplierInvoiceDocumentRetry: SupplierInvoiceDocumentRetryPayload;
  /** Upload a supplier invoice PDF for automated processing */
  supplierInvoiceUpload: SupplierInvoiceUploadPayload;
  /** Creates a task */
  taskCreate: TaskCreatePayload;
  /** Deletes a task */
  taskDelete: TaskDeletePayload;
  /** Update a task based on the provided ID. */
  taskEdit: TaskEditPayload;
  /** Create a new tax */
  taxCreate: TaxCreatePayload;
  /** Create a new tax group */
  taxGroupCreate: TaxGroupCreatePayload;
  /** Update future visits for a job */
  updateFutureVisits: UpdateFutureVisitsPayload;
  /** Update a user based on the provided ID. */
  userEdit: UserEditPayload;
  /** Create a vehicle */
  vehicleCreate: VehicleCreatePayload;
  /** Delete a vehicle */
  vehicleDelete: VehicleDeletePayload;
  /** Update vehicles */
  vehiclesUpdate: VehiclesUpdatePayload;
  /** Mark a visit complete based on the provided ID */
  visitComplete: VisitCompletePayload;
  /** Add visits to a job */
  visitCreate: VisitCreatePayload;
  /** Adds new line items to a visit */
  visitCreateLineItems: VisitCreateLineItemsPayload;
  /** Deletes a Visit */
  visitDelete: VisitDeletePayload;
  /** Removes line items from a visit */
  visitDeleteLineItems: VisitDeleteLineItemsPayload;
  /** Update a visit based on the provided ID. */
  visitEdit: VisitEditPayload;
  /** Edit assigned to on a visit */
  visitEditAssignedUsers: VisitEditAssignedUsersPayload;
  /** Edit line items on a visit */
  visitEditLineItems: VisitEditLineItemsPayload;
  /** Edit schedule for a visit */
  visitEditSchedule: VisitEditSchedulePayload;
  /** Mark a visit as uncomplete based on the provided ID */
  visitUncomplete: VisitUncompletePayload;
  /** Create a new webhook endpoint */
  webhookEndpointCreate: WebhookEndpointCreatePayload;
  /** Delete an existing webhook endpoint */
  webhookEndpointDelete: WebhookEndpointDeletePayload;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationAppAlertEditArgs = {
  input: AppAlertEditInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationAppInstanceLastSyncDateEditArgs = {
  input: LastSyncDateEditInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationAppointmentEditAssignmentArgs = {
  appointmentId: Scalars['EncodedId']['input'];
  input: AppointmentEditAssignmentInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationAppointmentEditCompletenessArgs = {
  appointmentId: Scalars['EncodedId']['input'];
  input: AppointmentEditCompletenessInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationAppointmentEditScheduleArgs = {
  appointmentId: Scalars['EncodedId']['input'];
  input: AppointmentEditScheduleInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationAssessmentCompleteArgs = {
  assessmentId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationAssessmentCreateArgs = {
  input: AssessmentCreateInput;
  requestId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationAssessmentDeleteArgs = {
  assessmentId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationAssessmentEditArgs = {
  assessmentId: Scalars['EncodedId']['input'];
  input: AssessmentEditInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationAssessmentUncompleteArgs = {
  assessmentId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationClientArchiveArgs = {
  clientId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationClientCreateArgs = {
  input: ClientCreateInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationClientCreateNoteArgs = {
  clientId: Scalars['EncodedId']['input'];
  input: ClientCreateNoteInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationClientDeleteNoteArgs = {
  input: ClientDeleteNoteInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationClientEditArgs = {
  clientId: Scalars['EncodedId']['input'];
  input: ClientEditInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationClientEditNoteArgs = {
  input: ClientEditNoteInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationClientNoteAddAttachmentArgs = {
  clientId: Scalars['EncodedId']['input'];
  noteAddAttachmentAttributes: Array<NoteAttachmentAttributes>;
  noteId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationClientUnarchiveArgs = {
  clientId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationClientsCreateArgs = {
  input: Array<ClientCreateInput>;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationCustomFieldConfigurationArchiveArgs = {
  customFieldConfigurationIds: Array<Scalars['EncodedId']['input']>;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationCustomFieldConfigurationCreateAreaArgs = {
  input: CustomFieldConfigurationCreateAreaInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationCustomFieldConfigurationCreateDropdownArgs = {
  input: CustomFieldConfigurationCreateDropdownInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationCustomFieldConfigurationCreateLinkArgs = {
  input: CustomFieldConfigurationCreateLinkInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationCustomFieldConfigurationCreateNumericArgs = {
  input: CustomFieldConfigurationCreateNumericInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationCustomFieldConfigurationCreateTextArgs = {
  input: CustomFieldConfigurationCreateTextInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationCustomFieldConfigurationCreateTrueFalseArgs = {
  input: CustomFieldConfigurationCreateTrueFalseInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationCustomFieldConfigurationEditArgs = {
  customFieldConfigurationId: Scalars['EncodedId']['input'];
  input: CustomFieldConfigurationEditInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationCustomFieldConfigurationUnarchiveArgs = {
  customFieldConfigurationIds: Array<Scalars['EncodedId']['input']>;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationEventCreateArgs = {
  input: EventCreateInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationExpenseCreateArgs = {
  input: ExpenseCreateInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationExpenseDeleteArgs = {
  expenseId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationExpenseEditArgs = {
  expenseId: Scalars['EncodedId']['input'];
  input: ExpenseEditInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationInvoiceCloseArgs = {
  id: Scalars['EncodedId']['input'];
  input: InvoiceCloseInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationInvoiceCreateArgs = {
  input: InvoiceCreateInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationInvoiceCreateNoteArgs = {
  input: InvoiceCreateNoteInput;
  invoiceId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationInvoiceEditArgs = {
  input: InvoiceEditInput;
  invoiceId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationInvoiceEditNoteArgs = {
  input: InvoiceEditNoteInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationInvoiceMarkAsSentArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationInvoiceReopenArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationInvoiceUnmarkBadDebtArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationJobCloseArgs = {
  input: JobCloseInput;
  jobId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationJobCreateArgs = {
  input: JobCreateAttributes;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationJobCreateLineItemsArgs = {
  input: JobCreateLineItemsInput;
  jobId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationJobCreateNoteArgs = {
  input: JobCreateNoteInput;
  jobId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationJobDeleteLineItemsArgs = {
  input: JobDeleteLineItemsInput;
  jobId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationJobDeleteNoteArgs = {
  input: JobDeleteNoteInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationJobEditArgs = {
  input: JobEditInput;
  jobId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationJobEditLineItemsArgs = {
  input: JobEditLineItemsInput;
  jobId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationJobEditNoteArgs = {
  input: JobEditNoteInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationJobNoteAddAttachmentArgs = {
  jobId: Scalars['EncodedId']['input'];
  noteAddAttachmentAttributes: Array<NoteAttachmentAttributes>;
  noteId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationJobOrderLineItemsArgs = {
  jobId: Scalars['EncodedId']['input'];
  orderedLineItemIds: Array<Scalars['EncodedId']['input']>;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationJobReopenArgs = {
  jobId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationOnMyWayTrackingLinkCreateArgs = {
  input: OnMyWayTrackingLinkCreateInput;
  visitId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationProductsAndServicesCreateArgs = {
  input: ProductsAndServicesInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationProductsAndServicesEditArgs = {
  input: ProductsAndServicesEditInput;
  productOrServiceId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationPropertyCreateArgs = {
  clientId: Scalars['EncodedId']['input'];
  input: PropertyCreateInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationPropertyEditArgs = {
  input: PropertyEditInput;
  propertyId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationQuoteCreateArgs = {
  attributes: QuoteCreateAttributes;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationQuoteCreateLineItemsArgs = {
  lineItems: Array<QuoteCreateLineItemAttributes>;
  quoteId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationQuoteCreateNoteArgs = {
  input: QuoteCreateNoteInput;
  quoteId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationQuoteCreateTextLineItemsArgs = {
  lineItems: Array<QuoteCreateTextLineItemAttributes>;
  quoteId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationQuoteDeleteLineItemsArgs = {
  lineItemIds: Array<Scalars['EncodedId']['input']>;
  quoteId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationQuoteEditArgs = {
  attributes: QuoteEditAttributes;
  quoteId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationQuoteEditLineItemsArgs = {
  lineItems: Array<QuoteEditLineItemAttributes>;
  quoteId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationQuoteEditNoteArgs = {
  input: QuoteEditNoteInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationRequestArchiveArgs = {
  requestId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationRequestCreateArgs = {
  input: RequestCreateInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationRequestCreateLineItemsArgs = {
  lineItems: Array<RequestCreateLineItemAttributes>;
  requestId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationRequestCreateNoteArgs = {
  input: RequestCreateNoteInput;
  requestId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationRequestDeleteLineItemsArgs = {
  lineItemIds: Array<Scalars['EncodedId']['input']>;
  requestId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationRequestEditArgs = {
  input: RequestEditInput;
  requestId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationRequestEditJobFormsArgs = {
  input?: InputMaybe<FormAttachmentInput>;
  requestId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationRequestEditLineItemsArgs = {
  lineItems: Array<RequestEditLineItemAttributes>;
  requestId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationRequestEditNoteArgs = {
  input: RequestEditNoteInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationRequestUnarchiveArgs = {
  requestId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationSupplierInvoiceDocumentRetryArgs = {
  documentId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationSupplierInvoiceUploadArgs = {
  signedBlobId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationTaskCreateArgs = {
  clientId?: InputMaybe<Scalars['EncodedId']['input']>;
  input: TaskCreateInput;
  propertyId?: InputMaybe<Scalars['EncodedId']['input']>;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationTaskDeleteArgs = {
  deleteFutureRecurring?: InputMaybe<Scalars['Boolean']['input']>;
  taskIds: Array<Scalars['EncodedId']['input']>;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationTaskEditArgs = {
  input: TaskEditInput;
  taskId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationTaxCreateArgs = {
  input: TaxCreateInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationTaxGroupCreateArgs = {
  input: TaxGroupCreateInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationUpdateFutureVisitsArgs = {
  input: UpdateFutureVisitsInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationUserEditArgs = {
  input: UserEditInput;
  userId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationVehicleCreateArgs = {
  input: VehicleCreateInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationVehicleDeleteArgs = {
  vehicleId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationVehiclesUpdateArgs = {
  input: Array<VehicleUpdateInput>;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationVisitCompleteArgs = {
  input?: InputMaybe<VisitCompleteInput>;
  visitId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationVisitCreateArgs = {
  input: VisitCreateInput;
  jobId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationVisitCreateLineItemsArgs = {
  input: VisitCreateLineItemInput;
  visitId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationVisitDeleteArgs = {
  visitIds: Array<Scalars['EncodedId']['input']>;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationVisitDeleteLineItemsArgs = {
  input: VisitDeleteLineItemsInput;
  visitId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationVisitEditArgs = {
  attributes: VisitEditAttributes;
  id: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationVisitEditAssignedUsersArgs = {
  input: VisitEditAssignedUsersInput;
  visitId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationVisitEditLineItemsArgs = {
  input: VisitEditLineItemsInput;
  visitId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationVisitEditScheduleArgs = {
  id: Scalars['EncodedId']['input'];
  input: VisitEditScheduleInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationVisitUncompleteArgs = {
  visitId: Scalars['EncodedId']['input'];
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationWebhookEndpointCreateArgs = {
  input: WebhookEndpointCreateInput;
};


/** The mutation root of Jobber's GraphQL interface. */
export type MutationWebhookEndpointDeleteArgs = {
  webhookEndpointsIds: Array<Scalars['EncodedId']['input']>;
};

/** User errors that are triggered by a mutation */
export type MutationErrors = UserErrorsInterface & {
  __typename?: 'MutationErrors';
  /** The message provided for this error. */
  message: Scalars['String']['output'];
  /** The field that triggered the error. */
  path: Array<Scalars['String']['output']>;
};

/** The name of a person */
export type Name = {
  __typename?: 'Name';
  /** The first name of the person */
  first: Scalars['String']['output'];
  /** The full name of the person */
  full: Scalars['String']['output'];
  /** The last name of the person */
  last: Scalars['String']['output'];
};

/** Attributes for a new attachment. If both url and signedBlobId are provided, signedBlobId takes precedence. */
export type NoteAttachmentAttributes = {
  /** The signed blob ID from ActiveStorage for an already uploaded file. Takes precedence over url if both provided. */
  signedBlobId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The URL of the attachment */
  url?: InputMaybe<Scalars['String']['input']>;
};

/** Attributes for filtering note attachments */
export type NoteAttachmentFilterAttributes = {
  /** Filter by the type of note the attachment belongs to */
  noteType?: InputMaybe<Array<NoteAttachmentNoteType>>;
};

/** The type of note a file is attached to, based on the polymorphic attached_to_type */
export type NoteAttachmentNoteType =
  /** Attached to a client note */
  | 'CLIENT'
  /** Attached to an invoice note */
  | 'INVOICE'
  /** Attached to a job note */
  | 'JOB'
  /** Attached to a quote note */
  | 'QUOTE'
  /** Attached to a request note */
  | 'REQUEST';

/** The attributes to sort on a notes attachments */
export type NoteAttachmentSortAttributes = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The field to sort on */
  field: NoteAttachmentsSortableFieldsEnum;
};

/** The fields on note attachments which support sorting functionality */
export type NoteAttachmentsSortableFieldsEnum =
  /** Sort by the created at date */
  | 'CREATED_AT'
  /** Sort by the workflow object order (Client, Request, Quote, Job, Invoice) */
  | 'WORKFLOW_ORDER';

export type NoteCreatedByUnion = Application | Client | User;

export type NoteFileInterface = {
  /** The type of the file */
  contentType: Scalars['String']['output'];
  /** The time the note file attachment was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The name of the file */
  fileName: Scalars['String']['output'];
  /** The size of the file in bytes */
  fileSize: Scalars['Int']['output'];
  /** The object id */
  id: Scalars['EncodedId']['output'];
  /** The possible statuses for the file */
  status: NoteFileStatusEnum;
  /** The location of the thumbnail */
  thumbnailUrl: Scalars['String']['output'];
  /** The time the note file attachment was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** The location of the file */
  url: Scalars['String']['output'];
};

/** The connection type for NoteFileInterface. */
export type NoteFileInterfaceConnection = {
  __typename?: 'NoteFileInterfaceConnection';
  /** A list of edges. */
  edges?: Maybe<Array<NoteFileInterfaceEdge>>;
  /** A list of nodes. */
  nodes: Array<NoteFileInterface>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type NoteFileInterfaceEdge = {
  __typename?: 'NoteFileInterfaceEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: NoteFileInterface;
};

export type NoteFileStatusEnum =
  /** The note file is being processed */
  | 'PROCESSING'
  /** The note file is has processed and is available */
  | 'READY';

export type NoteInterface = {
  /** When the note was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The user or app that created the note */
  createdBy?: Maybe<NoteCreatedByUnion>;
  /** The attached note files */
  fileAttachments: NoteFileInterfaceConnection;
  /** The ID of the note */
  id: Scalars['EncodedId']['output'];
  /** When the note was last updated by a user */
  lastEditedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The last user to edit the note */
  lastEditedBy?: Maybe<User>;
  /** What objects (client, quote, job, etc.) the note is linked to */
  linkedTo: NoteLink;
  /** The note message */
  message: Scalars['String']['output'];
  /** Whether the note is pinned */
  pinned: Scalars['Boolean']['output'];
};


export type NoteInterfaceFileAttachmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<NoteAttachmentFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<NoteAttachmentSortAttributes>>;
};

/**
 * Objects a note is linked to
 * ```
 *
 */
export type NoteLink = {
  __typename?: 'NoteLink';
  /** The note is linked to invoices */
  invoices: Scalars['Boolean']['output'];
  /** The note is linked to jobs */
  jobs: Scalars['Boolean']['output'];
  /** The note is linked to quotes */
  quotes: Scalars['Boolean']['output'];
  /** The note is linked to requests */
  requests: Scalars['Boolean']['output'];
};

/** The attributes to sort on a collection of notes */
export type NotesSortInput = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The key to sort on */
  key: NotesSortableFields;
};

/** The fields on a collection of notes which support sorting functionality */
export type NotesSortableFields =
  /** The field which indicates when the note was created at */
  | 'CREATED_AT';

/** A on my way tracking link */
export type OnMyWayTrackingLink = {
  __typename?: 'OnMyWayTrackingLink';
  /** The on my way tracking link */
  trackingLink: Scalars['Url']['output'];
  /** The vehicle */
  vehicle: Vehicle;
  /** The visit */
  visit: Visit;
};

/** Attributes for creating a new on my way tracking link */
export type OnMyWayTrackingLinkCreateInput = {
  /** The on my way tracking link */
  onMyWayTrackingLink: Scalars['Url']['input'];
};

/** Autogenerated return type of OnMyWayTrackingLinkCreate. */
export type OnMyWayTrackingLinkCreatePayload = {
  __typename?: 'OnMyWayTrackingLinkCreatePayload';
  /** The newly created on my way tracking link */
  onMyWayTrackingLink?: Maybe<OnMyWayTrackingLink>;
  /** Errors encountered when creating the on my way tracking link */
  userErrors: Array<MutationErrors>;
};

/** Configuration settings for Online Booking belonging to the account of the authenticated Service Provider */
export type OnlineBookingConfiguration = {
  __typename?: 'OnlineBookingConfiguration';
  /** Is the online booking page belonging to the account of the authenticated Service Provider currently available to the public */
  acceptingOnlineBookings: Scalars['Boolean']['output'];
  /** The HTML for embedding the public online booking form */
  bookingEmbedScript?: Maybe<Scalars['String']['output']>;
  /** Fully qualified URL for the SP's unique booking page. Shareable to SCs. */
  bookingUrl: Scalars['String']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
};

/** An other payment applied to a quote or invoice */
export type OtherPaymentRecord = PaymentRecordInterface & {
  __typename?: 'OtherPaymentRecord';
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance (absolute value) */
  amount: Scalars['Float']['output'];
  /** Whether the payment can be edited */
  canEdit: Scalars['Boolean']['output'];
  /** The client associated with the payment */
  client?: Maybe<Client>;
  /** The confirmation number of the payment */
  confirmationNumber?: Maybe<Scalars['String']['output']>;
  /** Additional details about the payment */
  details?: Maybe<Scalars['String']['output']>;
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The invoice associated with the payment */
  invoice?: Maybe<Invoice>;
  /** Where the payment originated from */
  paymentOrigin?: Maybe<PaymentOrigin>;
  /** The type of payment used, i.e cash, check, Jobber Payments... */
  paymentType?: Maybe<PaymentType>;
  /** The quote associated with the deposit payment */
  quote?: Maybe<Quote>;
  /** The raw amount applied against the quote or invoice balance (preserves sign). */
  rawAmount: Scalars['Float']['output'];
  /** Refunds associated with the payment */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** If sent, the DateTime the payment record was sent to client. */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};


/** An other payment applied to a quote or invoice */
export type OtherPaymentRecordAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** An other payment applied to a quote or invoice */
export type OtherPaymentRecordRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** Information about pagination in a connection. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean']['output'];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars['String']['output']>;
};

/** A Payment Balance Transaction */
export type PaymentBalanceTransaction = BalanceTransactionInterface & {
  __typename?: 'PaymentBalanceTransaction';
  /** The date the balance transaction was created */
  created: Scalars['ISO8601DateTime']['output'];
  /** The type of currency used */
  currency: Scalars['String']['output'];
  /** The balance transaction fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The balance transaction gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The balance transaction net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The payment record associated with */
  paymentRecord?: Maybe<PaymentRecordInterface>;
  /** The balance transaction tip amount in cents */
  tipAmount?: Maybe<Scalars['Int']['output']>;
  /** The balance transaction type */
  type?: Maybe<BalanceTransaction>;
};

/** The connection type for PaymentMethodInterface. */
export type PaymentMethodInterfaceConnection = {
  __typename?: 'PaymentMethodInterfaceConnection';
  /** A list of edges. */
  edges?: Maybe<Array<PaymentMethodInterfaceEdge>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type PaymentMethodInterfaceEdge = {
  __typename?: 'PaymentMethodInterfaceEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
};

/** Vault origins available for saved jobber payment cards */
export type PaymentMethodSource =
  /** A bank account payment method */
  | 'BANK_ACCOUNT'
  /** A credit card payment method */
  | 'CREDIT_CARD';

/** Where the payment originated from */
export type PaymentOrigin =
  /** Payment came through Jobber's API (e.g. Jobber's mobile app) */
  | 'API_ORIGIN'
  /** Payment from a card reader */
  | 'CARD_READER'
  /** An account's client paid through the web app (e.g. by clicking the invoice in the email) */
  | 'CLIENT_ONLINE_ORIGIN'
  /** Employee paid through the web app */
  | 'EMPLOYEE_ONLINE_ORIGIN'
  /** Payment from Google Pay or Apple Pay */
  | 'EWALLET_ORIGIN'
  /** DEPRECATED payment from a mobile device */
  | 'MOBILE_ORIGIN'
  /** Payment from a swipe device i.e Square */
  | 'SWIPE_ORIGIN'
  /** Payment created from an automated job (e.g. automatic payments) */
  | 'SYSTEM_GENERATED'
  /** Payment from a tap-to-pay device */
  | 'TAP_TO_PAY'
  /** Payment from physical card reader (Stripe Terminal, including Tap-on-Mobile; only for Jobber Payments) */
  | 'TERMINAL_ORIGIN'
  /** Default value */
  | 'UNKNOWN_ORIGIN';

/** Payment records applied to a quote or invoice */
export type PaymentRecord = {
  __typename?: 'PaymentRecord';
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance */
  amount: Scalars['Float']['output'];
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The last4 of payment method */
  jobberPaymentLast4?: Maybe<Scalars['String']['output']>;
  /** The payment method */
  jobberPaymentPaymentMethod?: Maybe<PaymentMethodSource>;
  /** The status of the jobber payment, returns null for other payment types */
  jobberPaymentTransactionStatus?: Maybe<JobberPaymentTransactionStatus>;
  /** Refunds associated with the payment record */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** The amount of tip attached to a Jobber payment */
  tipAmount?: Maybe<Scalars['Float']['output']>;
};


/** Payment records applied to a quote or invoice */
export type PaymentRecordAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** Payment records applied to a quote or invoice */
export type PaymentRecordRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** Interface for payment record allocations */
export type PaymentRecordAllocationInterface = {
  /** The allocation amount */
  amount: Scalars['Float']['output'];
};

/** The connection type for PaymentRecordAllocationInterface. */
export type PaymentRecordAllocationInterfaceConnection = {
  __typename?: 'PaymentRecordAllocationInterfaceConnection';
  /** A list of edges. */
  edges?: Maybe<Array<PaymentRecordAllocationInterfaceEdge>>;
  /** A list of nodes. */
  nodes: Array<PaymentRecordAllocationInterface>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type PaymentRecordAllocationInterfaceEdge = {
  __typename?: 'PaymentRecordAllocationInterfaceEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: PaymentRecordAllocationInterface;
};

/** The connection type for PaymentRecord. */
export type PaymentRecordConnection = {
  __typename?: 'PaymentRecordConnection';
  /** A list of edges. */
  edges?: Maybe<Array<PaymentRecordEdge>>;
  /** A list of nodes. */
  nodes: Array<PaymentRecord>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type PaymentRecordEdge = {
  __typename?: 'PaymentRecordEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: PaymentRecord;
};

/** Attributes for filtering payment records */
export type PaymentRecordFilterAttributes = {
  /** The payment record's adjustment type to filter by */
  adjustmentType?: InputMaybe<IncomeAdjustmentType>;
  /** The unique identifier for a client */
  clientId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The payment record's entry date to filter by */
  entryDate?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The payment type to filter by */
  paymentType?: InputMaybe<PaymentType>;
  /** Whether or not the payment is refundable */
  refundable?: InputMaybe<Scalars['Boolean']['input']>;
};

export type PaymentRecordInterface = {
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance (absolute value) */
  amount: Scalars['Float']['output'];
  /** Whether the payment can be edited */
  canEdit: Scalars['Boolean']['output'];
  /** The client associated with the payment */
  client?: Maybe<Client>;
  /** Additional details about the payment */
  details?: Maybe<Scalars['String']['output']>;
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The ID of the payment record */
  id: Scalars['EncodedId']['output'];
  /** The invoice associated with the payment */
  invoice?: Maybe<Invoice>;
  /** Where the payment originated from */
  paymentOrigin?: Maybe<PaymentOrigin>;
  /** The type of payment used, i.e cash, check, Jobber Payments... */
  paymentType?: Maybe<PaymentType>;
  /** The quote associated with the deposit payment */
  quote?: Maybe<Quote>;
  /** The raw amount applied against the quote or invoice balance (preserves sign). */
  rawAmount: Scalars['Float']['output'];
  /** Refunds associated with the payment */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** If sent, the DateTime the payment record was sent to client. */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};


export type PaymentRecordInterfaceAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type PaymentRecordInterfaceRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** The connection type for PaymentRecordInterface. */
export type PaymentRecordInterfaceConnection = {
  __typename?: 'PaymentRecordInterfaceConnection';
  /** A list of edges. */
  edges?: Maybe<Array<PaymentRecordInterfaceEdge>>;
  /** A list of nodes. */
  nodes: Array<PaymentRecordInterface>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type PaymentRecordInterfaceEdge = {
  __typename?: 'PaymentRecordInterfaceEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: PaymentRecordInterface;
};

/** Refund record applied to a payment record */
export type PaymentRecordRefund = {
  __typename?: 'PaymentRecordRefund';
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance */
  amount: Scalars['Float']['output'];
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The status of the jobber payment, returns null for other payment types */
  jobberPaymentTransactionStatus?: Maybe<JobberPaymentTransactionStatus>;
  /** Surcharge amount in dollars (for surcharged payments) */
  surchargeAmount?: Maybe<Scalars['Float']['output']>;
  /** Tax on surcharge in dollars (for surcharged payments) */
  surchargeTaxAmount?: Maybe<Scalars['Float']['output']>;
  /** The amount of tip attached to a Jobber payment */
  tipAmount?: Maybe<Scalars['Float']['output']>;
};


/** Refund record applied to a payment record */
export type PaymentRecordRefundAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** The connection type for PaymentRecordRefund. */
export type PaymentRecordRefundConnection = {
  __typename?: 'PaymentRecordRefundConnection';
  /** A list of edges. */
  edges?: Maybe<Array<PaymentRecordRefundEdge>>;
  /** A list of nodes. */
  nodes: Array<PaymentRecordRefund>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type PaymentRecordRefundEdge = {
  __typename?: 'PaymentRecordRefundEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: PaymentRecordRefund;
};

/** Attributes for sorting payment records */
export type PaymentRecordSortAttributes = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The key to sort on */
  key: PaymentRecordSortKey;
};

/** The fields on a payment record which support sorting functionality */
export type PaymentRecordSortKey =
  /** The field which indicates when the payment record was created in the system */
  | 'CREATED_AT'
  /** The field which indicates the entry date of the payment record */
  | 'ENTRY_DATE'
  /** Sort using the list_order logic: Initial Balance last, then by entry date (day precision), then by created_at. Direction parameter is ignored. */
  | 'LIST_ORDER'
  /** The field which indicates when the payment record was last updated */
  | 'UPDATED_AT';

/** The type of payment used, i.e cash, check, Jobber Payments... */
export type PaymentType =
  /** Paid with ACH bank payment */
  | 'ACH_BANK_PAYMENT'
  /** Paid with a bank transfer */
  | 'BANK_TRANSFER'
  /** Paid with cash */
  | 'CASH'
  /** Paid with cash app */
  | 'CASH_APP'
  /** Paid with check */
  | 'CHEQUE'
  /** Paid with consumer financing i.e Wisetack */
  | 'CONSUMER_FINANCING'
  /** Paid with credit or debit card (outside of Jobber) */
  | 'CREDIT_CARD'
  /** Paid with one of our payment integration providers */
  | 'EPAYMENT'
  /** Paid with e-transfer */
  | 'E_TRANSFER'
  /** Paid with Jobber Payments */
  | 'JOBBER_PAYMENTS'
  /** Paid with a money order */
  | 'MONEY_ORDER'
  /** Paid with a method not listed */
  | 'OTHER'
  /** Paid with paypal */
  | 'PAYPAL'
  /** Paid with venmo */
  | 'VENMO'
  /** Paid with zelle */
  | 'ZELLE';

export type Payout =
  /** The payout is of type Bank Account */
  | 'BANK_ACCOUNT'
  /** The payout is of type Card */
  | 'CARD';

/** Attributes for filtering payouts */
export type PayoutFilterAttributes = {
  /** The payout arrival date to filter by */
  arrivalDateRange?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The payout created at date to filter by */
  createdAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The payout method to filter by */
  payoutMethod?: InputMaybe<PayoutMethod>;
  /** The payout status to filter by */
  status?: InputMaybe<PayoutStatus>;
  /** The payout updated at date to filter by */
  updatedAt?: InputMaybe<Iso8601DateTimeRangeInput>;
};

export type PayoutMethod =
  /** The payout is of method instant */
  | 'INSTANT'
  /** The payout is of method standard */
  | 'STANDARD';

/** A payout is the transfer of funds to a bank account */
export type PayoutRecord = {
  __typename?: 'PayoutRecord';
  /** The expected arrival date of payout */
  arrivalDate: Scalars['ISO8601DateTime']['output'];
  /** The transactions of the payout */
  balanceTransactions: BalanceTransactionInterfaceConnection;
  /** The date the payout was created in Stripe */
  created: Scalars['ISO8601DateTime']['output'];
  /** The date the payout was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The currency used for the payout */
  currency: Scalars['String']['output'];
  /** The payout fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The payout gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The payout identifier */
  identifier: Scalars['String']['output'];
  /** The payout net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The payout method */
  payoutMethod: PayoutMethod;
  /** The status of the payout */
  status: PayoutStatus;
  /** The payout type */
  type: Payout;
  /** The date the payout was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
};


/** A payout is the transfer of funds to a bank account */
export type PayoutRecordBalanceTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** The connection type for PayoutRecord. */
export type PayoutRecordConnection = {
  __typename?: 'PayoutRecordConnection';
  /** A list of edges. */
  edges?: Maybe<Array<PayoutRecordEdge>>;
  /** A list of nodes. */
  nodes: Array<PayoutRecord>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type PayoutRecordEdge = {
  __typename?: 'PayoutRecordEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: PayoutRecord;
};

/** The options to sort payouts */
export type PayoutSortInput = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The key to sort on */
  key: PayoutSortKey;
};

/** The fields, or associated fields, on a collection of invoices which support sorting functionality */
export type PayoutSortKey =
  /** The date the payout is expected to arrive */
  | 'ARRIVAL_DATE'
  /** The amount of the payout */
  | 'NET_AMOUNT';

export type PayoutStatus =
  /** The payout status is Canceled */
  | 'CANCELED'
  /** The payout status is Failed */
  | 'FAILED'
  /** The payout status is In Transit */
  | 'IN_TRANSIT'
  /** The payout status is Paid */
  | 'PAID'
  /** The payout status is Pending */
  | 'PENDING';

/** A paypal payment applied to a quote or invoice */
export type PaypalPaymentRecord = PaymentRecordInterface & {
  __typename?: 'PaypalPaymentRecord';
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance (absolute value) */
  amount: Scalars['Float']['output'];
  /** Whether the payment can be edited */
  canEdit: Scalars['Boolean']['output'];
  /** The client associated with the payment */
  client?: Maybe<Client>;
  /** The confirmation number of the paypal payment */
  confirmationNumber?: Maybe<Scalars['String']['output']>;
  /** Additional details about the payment */
  details?: Maybe<Scalars['String']['output']>;
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The invoice associated with the payment */
  invoice?: Maybe<Invoice>;
  /** Where the payment originated from */
  paymentOrigin?: Maybe<PaymentOrigin>;
  /** The type of payment used, i.e cash, check, Jobber Payments... */
  paymentType?: Maybe<PaymentType>;
  /** The quote associated with the deposit payment */
  quote?: Maybe<Quote>;
  /** The raw amount applied against the quote or invoice balance (preserves sign). */
  rawAmount: Scalars['Float']['output'];
  /** Refunds associated with the payment */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** If sent, the DateTime the payment record was sent to client. */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};


/** A paypal payment applied to a quote or invoice */
export type PaypalPaymentRecordAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A paypal payment applied to a quote or invoice */
export type PaypalPaymentRecordRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type PermissionAreaFilterEnum =
  | 'ACCOUNT'
  | 'BOOKKEEPING'
  | 'BUNKER'
  | 'CHEMICAL_TREATMENTS'
  | 'CLIENTS'
  | 'CLIENTS_INDEX'
  | 'CLIENT_MEDIA'
  | 'CLIENT_NOTES'
  | 'EXPENSES'
  | 'FORMS_AND_CHECKLISTS'
  | 'INVOICES'
  | 'INVOICES_INDEX'
  | 'INVOICE_NOTES'
  | 'JOB_COSTING'
  | 'JOB_NOTES'
  | 'MARKETING_SUITE'
  | 'PRICING'
  | 'QUOTES'
  | 'QUOTES_INDEX'
  | 'QUOTE_NOTES'
  | 'REPORTS'
  | 'SALES_PIPELINE'
  | 'TIME_SHEETS'
  | 'TO_DOS'
  | 'TWO_WAY_SMS'
  | 'WEBSITE'
  | 'WORK_ORDERS'
  | 'WORK_ORDERS_INDEX'
  | 'WORK_REQUESTS'
  | 'WORK_REQUESTS_INDEX'
  | 'WORK_REQUEST_NOTES';

export type PermissionLevelFilterEnum =
  /** View and create */
  | 'CREATE'
  /** View, create, edit, and delete */
  | 'DELETE'
  /** All permissions */
  | 'FULL'
  /** Highest permission level without becoming an admin */
  | 'MANAGE'
  /** No permission granted */
  | 'NONE'
  /** View */
  | 'READ'
  /** View, create, and edit */
  | 'WRITE';

/** Attributes for filtering phone numbers */
export type PhoneFilterInput = {
  /** Whether to include phone numbers attached to secondary contacts. This filter has no effect without include_secondary_contacts set to true */
  includeSecondaryContacts?: InputMaybe<Scalars['Boolean']['input']>;
  /** The properties to filter phone numbers by. This filter has no effect without include_secondary_contacts set to true */
  propertyIds?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
};

/** Attributes of a phone number */
export type PhoneNumberCreateAttributes = {
  /** The phone type */
  description?: InputMaybe<PhoneNumberDescription>;
  /** The phone number as stored */
  number?: InputMaybe<Scalars['String']['input']>;
  /** Is this the primary phone number? */
  primary?: InputMaybe<Scalars['Boolean']['input']>;
  /** Can the phone number receive text messages? */
  smsAllowed?: InputMaybe<Scalars['Boolean']['input']>;
};

export type PhoneNumberDescription =
  /** The phone number is of type Fax */
  | 'FAX'
  /** The phone number is of type Home */
  | 'HOME'
  /** The phone number is of type Main */
  | 'MAIN'
  /** The phone number is of type Mobile */
  | 'MOBILE'
  /** The phone number is of type Other */
  | 'OTHER'
  /** The phone number is of type Work */
  | 'WORK';

/** A phone number */
export type PhoneNumberInterface = {
  /** The area code of the phone number */
  areaCode?: Maybe<Scalars['String']['output']>;
  /** The country code of the  */
  countryCode?: Maybe<Scalars['String']['output']>;
  /** A user friendly representation of the phone number */
  friendly?: Maybe<Scalars['String']['output']>;
  /** Is the phone number valid */
  isValid: Scalars['Boolean']['output'];
  /** The phone number as stored (may be standard or what was entered by user) */
  raw: Scalars['String']['output'];
};

/** Attributes for updating a phone number */
export type PhoneNumberUpdateAttributes = {
  /** The phone type */
  description?: InputMaybe<PhoneNumberDescription>;
  /** The id of the phone number being changed. */
  id: Scalars['EncodedId']['input'];
  /** The phone number as stored */
  number?: InputMaybe<Scalars['String']['input']>;
  /** Is this the primary phone number? */
  primary?: InputMaybe<Scalars['Boolean']['input']>;
  /** Can the phone number receive text messages? */
  smsAllowed?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The processor that performed the work on the object */
export type Processor =
  /** Object was processed by a Task */
  | 'TASK';

/** The collection of attributes that represent a product or service */
export type ProductOrService = CustomFieldsInterface & {
  __typename?: 'ProductOrService';
  /** The type of booking to be created in online booking for the product or service */
  bookableType?: Maybe<SelfServeBooking>;
  /** The item's category */
  category: ProductsAndServicesCategory;
  /** The custom fields set for this object */
  customFields: Array<CustomFieldUnion>;
  /** A product or service has a default price */
  defaultUnitCost: Scalars['Float']['output'];
  /** The description of product or service */
  description?: Maybe<Scalars['String']['output']>;
  /** The duration of the service in minutes */
  durationMinutes?: Maybe<Scalars['Minutes']['output']>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** A product or service has a default internal unit cost */
  internalUnitCost?: Maybe<Scalars['Float']['output']>;
  /** The last line item created for this product or service */
  lastJobLineItem?: Maybe<JobLineItem>;
  /** The last quote line item created for this product or service */
  lastQuoteLineItem?: Maybe<QuoteLineItem>;
  /** A product or service has a default markup */
  markup?: Maybe<Scalars['Float']['output']>;
  /** The name of the product or service */
  name: Scalars['String']['output'];
  /** Sort order of the service on the booking page */
  onlineBookingSortOrder?: Maybe<Scalars['Int']['output']>;
  /** Whether the service is enabled on the booking page */
  onlineBookingsEnabled?: Maybe<Scalars['Boolean']['output']>;
  /** Quantity range for the product or service when created through online booking */
  quantityRange?: Maybe<QuantityRange>;
  /** A product or service can be taxable or non-taxable */
  taxable?: Maybe<Scalars['Boolean']['output']>;
  /** A 'visible' product or service will show up as an autocomplete suggestion on quotes/jobs/invoice line items */
  visible?: Maybe<Scalars['Boolean']['output']>;
};


/** The collection of attributes that represent a product or service */
export type ProductOrServiceLastJobLineItemArgs = {
  propertyId?: InputMaybe<Scalars['EncodedId']['input']>;
};


/** The collection of attributes that represent a product or service */
export type ProductOrServiceLastQuoteLineItemArgs = {
  propertyId?: InputMaybe<Scalars['EncodedId']['input']>;
};

/** The connection type for ProductOrService. */
export type ProductOrServiceConnection = {
  __typename?: 'ProductOrServiceConnection';
  /** A list of edges. */
  edges?: Maybe<Array<ProductOrServiceEdge>>;
  /** A list of nodes. */
  nodes: Array<ProductOrService>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type ProductOrServiceEdge = {
  __typename?: 'ProductOrServiceEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: ProductOrService;
};

export type ProductsAndServicesCategory =
  /** The item is of type Product */
  | 'PRODUCT'
  /** The item is of type Service */
  | 'SERVICE';

/** Attributes for updating a product or service */
export type ProductsAndServicesEditInput = {
  /** The type of the product or service when created through online booking */
  bookableType?: InputMaybe<SelfServeBooking>;
  /** Whether this item will be a product or a service */
  category?: InputMaybe<ProductsAndServicesCategory>;
  /** List of custom fields to modify or add */
  customFields?: InputMaybe<Array<CustomFieldEditInput>>;
  /** The default price for the service or product */
  defaultUnitCost?: InputMaybe<Scalars['Float']['input']>;
  /** The description for the service or product */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Duration to complete the service in minutes */
  durationMinutes?: InputMaybe<Scalars['Int']['input']>;
  /** The default unit cost for the product or service */
  internalUnitCost?: InputMaybe<Scalars['Float']['input']>;
  /** Whether the product or service will have a default markup */
  markup?: InputMaybe<Scalars['Float']['input']>;
  /** Name of the product or service item */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The product or service is also available as a bookable service */
  onlineBookingsEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** Quantity range for the product or service when created through online booking */
  quantityRange?: InputMaybe<QuantityRangeInput>;
  /** Whether the product or service will be taxable */
  taxable?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether the product or service will be visible */
  visible?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Attributes for creating a product or service */
export type ProductsAndServicesInput = {
  /** The type of the product or service when created through online booking */
  bookableType?: InputMaybe<SelfServeBooking>;
  /** Whether this item will be a product or a service */
  category?: InputMaybe<ProductsAndServicesCategory>;
  /** List of custom fields to add */
  customFields?: InputMaybe<Array<CustomFieldCreateInput>>;
  /** The default price for the service or product */
  defaultUnitCost: Scalars['Float']['input'];
  /** The description for the service or product */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Duration to complete the service in minutes */
  durationMinutes?: InputMaybe<Scalars['Int']['input']>;
  /** The default unit cost for the product or service */
  internalUnitCost?: InputMaybe<Scalars['Float']['input']>;
  /** Whether the product or service will have a default markup */
  markup?: InputMaybe<Scalars['Float']['input']>;
  /** Name of the product or service item */
  name: Scalars['String']['input'];
  /** The product or service is also available as a bookable service */
  onlineBookingsEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** Quantity range for the product or service when created through online booking */
  quantityRange?: InputMaybe<QuantityRangeInput>;
  /** Whether the product or service will be taxable */
  taxable?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The attributes to sort on products and services detail data */
export type ProductsAndServicesSortInput = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The key to sort on */
  key: ProductsAndServicesSortKey;
};

/** The fields, on a collection of ProductsAndServices which support sorting functionality */
export type ProductsAndServicesSortKey =
  /** The product or service category */
  | 'CATEGORY'
  /** The product or service name */
  | 'NAME';

/** Attributes for filtering products */
export type ProductsFilterInput = {
  /** The item's category */
  category?: InputMaybe<Array<WorkItemCategoryTypeEnum>>;
  /** The ids of the products and services to filter by */
  ids?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** The sorting options */
  sort?: InputMaybe<ProductsAndServicesSortInput>;
};

/** Attributes for filtering properties */
export type PropertiesFilterAttributes = {
  /** The unique identifier of the client */
  clientId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** Filter by primary property: true = only primary, false = exclude primary, omit = all */
  primary?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Properties are locations owned by Service Consumers where Service Providers provide service for */
export type Property = CustomFieldsInterface & {
  __typename?: 'Property';
  /** The address of the property */
  address: PropertyAddress;
  /**
   * The city for this address.
   * @deprecated Use the fields available on 'address' instead
   */
  city: Scalars['String']['output'];
  /** The client associated with the property */
  client?: Maybe<Client>;
  /** The contacts associated with the property */
  contacts?: Maybe<ContactModelConnection>;
  /**
   * The country of this address.
   * @deprecated Use the fields available on 'address' instead
   */
  country: Scalars['String']['output'];
  /** The custom fields set for this object */
  customFields: Array<CustomFieldUnion>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** Whether the property is a billing address */
  isBillingAddress?: Maybe<Scalars['Boolean']['output']>;
  /** The URI for the given record in Jobber Online */
  jobberWebUri: Scalars['String']['output'];
  /** The jobs associated with the property */
  jobs: JobConnection;
  /**
   * The latitude of this address.
   * @deprecated Use the fields available on 'address' instead
   */
  latitude: Scalars['String']['output'];
  /**
   * The longitude of this address.
   * @deprecated Use the fields available on 'address' instead
   */
  longitude: Scalars['String']['output'];
  /** The name of the property */
  name?: Maybe<Scalars['String']['output']>;
  /**
   * The zip or postal code of this address.
   * @deprecated Use the fields available on 'address' instead
   */
  postalCode: Scalars['String']['output'];
  /**
   * The state or province of this address.
   * @deprecated Use the fields available on 'address' instead
   */
  province: Scalars['String']['output'];
  /** The quotes associated with the property */
  quotes: QuoteConnection;
  /** The recently used work items for the property. */
  recentPricing?: Maybe<ProductOrServiceConnection>;
  /** The requests associated with the property */
  requests: RequestConnection;
  /** The routing order of the property */
  routingOrder?: Maybe<Scalars['Int']['output']>;
  /** All scheduled items associated with the property, including visits, tasks, assessments, events, and reminders */
  scheduledItems: ScheduledItemInterfaceConnection;
  /**
   * The street component
   * @deprecated Use the fields available on 'address' instead
   */
  street: Scalars['String']['output'];
  /**
   * The first line of the street address
   * @deprecated Use the fields available on 'address' instead
   */
  street1: Scalars['String']['output'];
  /**
   * The second line of the street address
   * @deprecated Use the fields available on 'address' instead
   */
  street2: Scalars['String']['output'];
  /** The tax rate of the property */
  taxRate?: Maybe<TaxRate>;
};


/** Properties are locations owned by Service Consumers where Service Providers provide service for */
export type PropertyContactsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<PropertyContactFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<ContactsSortInput>>;
};


/** Properties are locations owned by Service Consumers where Service Providers provide service for */
export type PropertyJobsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** Properties are locations owned by Service Consumers where Service Providers provide service for */
export type PropertyQuotesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** Properties are locations owned by Service Consumers where Service Providers provide service for */
export type PropertyRecentPricingArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** Properties are locations owned by Service Consumers where Service Providers provide service for */
export type PropertyRequestsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** Properties are locations owned by Service Consumers where Service Providers provide service for */
export type PropertyScheduledItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<PropertyScheduledItemsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** Address of properties owned by Service Consumers where Service Providers provide service for */
export type PropertyAddress = AddressInterface & {
  __typename?: 'PropertyAddress';
  /** The city of the address */
  city?: Maybe<Scalars['String']['output']>;
  /** The point coordinates of the address if it has been geo-coded */
  coordinates?: Maybe<GeoPoint>;
  /** The country of the address */
  country?: Maybe<Scalars['String']['output']>;
  /** The status of geo-locating the coordinates for an address */
  geoStatus?: Maybe<GeoStatus>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The name of the property for the address */
  name?: Maybe<Scalars['String']['output']>;
  /** The postal code of the address */
  postalCode?: Maybe<Scalars['String']['output']>;
  /** The province of the address */
  province?: Maybe<Scalars['String']['output']>;
  /** The street address */
  street: Scalars['String']['output'];
  /** The first line of the street address */
  street1?: Maybe<Scalars['String']['output']>;
  /** The second line of the street address */
  street2?: Maybe<Scalars['String']['output']>;
};

/** Attributes of a property */
export type PropertyAttributes = {
  /** The address of the property */
  address: AddressAttributes;
  /** List of contacts to create and assign to the property */
  contacts?: InputMaybe<Array<ContactCreateAttributes>>;
  /** List of existing contacts to assign to the property */
  contactsToAssign?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** List of custom fields to add */
  customFields?: InputMaybe<Array<CustomFieldCreateInput>>;
  /** The name of the property */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The unique identifier of the tax rate associated with the property */
  taxRateId?: InputMaybe<Scalars['EncodedId']['input']>;
};

/** The connection type for Property. */
export type PropertyConnection = {
  __typename?: 'PropertyConnection';
  /** A list of edges. */
  edges?: Maybe<Array<PropertyEdge>>;
  /** A list of nodes. */
  nodes: Array<Property>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** Attributes for filtering property contacts */
export type PropertyContactFilterAttributes = {
  /** Whether to include client contacts */
  includeClientContacts?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Attributes for creating a new property */
export type PropertyCreateInput = {
  /** The list of properties */
  properties?: InputMaybe<Array<PropertyAttributes>>;
};

/** Autogenerated return type of PropertyCreate. */
export type PropertyCreatePayload = {
  __typename?: 'PropertyCreatePayload';
  /** The client of the property */
  client?: Maybe<Client>;
  /** The properties which have been created successfully */
  properties: Array<Property>;
  /** Errors encountered when creating the property */
  userErrors: Array<MutationErrors>;
};

/** An edge in a connection. */
export type PropertyEdge = {
  __typename?: 'PropertyEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Property;
};

/** Attributes for editing an existing property */
export type PropertyEditAttributes = {
  /** The address for this property */
  address?: InputMaybe<ClientAddressUpdateAttributes>;
  /** List of contacts to create and assign to the property */
  contactsToAdd?: InputMaybe<Array<ContactCreateAttributes>>;
  /** List of existing contacts to assign to the property */
  contactsToAssign?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** List of contacts to delete */
  contactsToDelete?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** List of contacts to update and assign to the property */
  contactsToEdit?: InputMaybe<Array<ContactEditAttributes>>;
  /** List of existing contacts to unassign from the property */
  contactsToRemove?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** The custom fields for this property */
  customFields?: InputMaybe<Array<CustomFieldEditInput>>;
  /** The name of the property */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The ID of the property */
  propertyId: Scalars['EncodedId']['input'];
  /** The tax rate for this property */
  taxRateId?: InputMaybe<Scalars['EncodedId']['input']>;
};

/** Attributes for updating a property */
export type PropertyEditInput = {
  /** The address of the property */
  address?: InputMaybe<AddressAttributes>;
  /** List of contacts to create and assign to the property */
  contactsToAdd?: InputMaybe<Array<ContactCreateAttributes>>;
  /** List of existing contacts to assign to the property */
  contactsToAssign?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** List of contacts to delete */
  contactsToDelete?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** List of contacts to update and assign to the property */
  contactsToEdit?: InputMaybe<Array<ContactEditAttributes>>;
  /** List of existing contacts to unassign from the property */
  contactsToRemove?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** List of custom fields to modify or add */
  customFields?: InputMaybe<Array<CustomFieldEditInput>>;
  /** The name of the property */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The tax rate for this property */
  taxRateId?: InputMaybe<Scalars['EncodedId']['input']>;
};

/** Autogenerated return type of PropertyEdit. */
export type PropertyEditPayload = {
  __typename?: 'PropertyEditPayload';
  /** The modified property */
  property?: Maybe<Property>;
  /** Errors encountered when modifying the property */
  userErrors: Array<MutationErrors>;
};

/** Attributes for filtering scheduled items on a property */
export type PropertyScheduledItemsFilter = {
  /** The type of scheduled item to filter by */
  scheduleItemType?: InputMaybe<ScheduledItemType>;
};

/** Defines the valid range of quantities for a product or service when created through online booking */
export type QuantityRange = {
  __typename?: 'QuantityRange';
  /** The maximum quantity (inclusive) an SC can select when booking this product or service */
  maxQuantity?: Maybe<Scalars['Int']['output']>;
  /** The minimum quantity (inclusive) an SC can select when booking this product or service */
  minQuantity?: Maybe<Scalars['Int']['output']>;
  /** True if the quantity range will be used when booking this product or service, false otherwise */
  quantityEnabled: Scalars['Boolean']['output'];
};

/** Defines the valid range of quantities for a product or service */
export type QuantityRangeInput = {
  /** The maximum quantity (inclusive) an SC can select when choosing this product or service */
  maxQuantity?: InputMaybe<Scalars['Int']['input']>;
  /** The minimum quantity (inclusive) an SC can select when choosing this product or service */
  minQuantity?: InputMaybe<Scalars['Int']['input']>;
  /** True if the quantity range will be used when choosing this product or service, false otherwise */
  quantityEnabled: Scalars['Boolean']['input'];
};

/** The query root of Jobber's GraphQL interface. */
export type Query = {
  __typename?: 'Query';
  /** The account the authenticated user belongs to */
  account?: Maybe<Account>;
  /**
   * Deprecated: Do not use in new development. This is a temporary resolver used only for the mobile Account REST-to-GraphQL migration.
   * @deprecated This resolver is deprecated and will be removed in a future version. Use `AccountType` for accessing account information.
   */
  accountUnsafe?: Maybe<AccountUnsafe>;
  /** List of 100 app alerts */
  appAlerts: AppAlertConnection;
  /** List of applications which improve Jobber's experience */
  apps: ApplicationConnection;
  /** Single assessment by unique identifier, belonging to the account of the authenticated Service Provider */
  assessment?: Maybe<Assessment>;
  /** List of recently updated Capital loans, belonging to the account of the authenticated user */
  capitalLoans: JobberPaymentsCapitalLoanConnection;
  /** Single client by unique identifier belonging to the account of the authenticated in Service Provider */
  client?: Maybe<Client>;
  /**
   * Search for a client email address by name or email. Results are sorted
   * by most plausible match in descending order.
   *
   * Returns results from the most recently active clients if the search term is blank.
   *
   */
  clientEmails: EmailConnection;
  /** Metadata for a client */
  clientMeta?: Maybe<ClientMeta>;
  /** A single client phone number */
  clientPhone: ClientPhoneNumber;
  /** All client phone numbers. Sort order is by most recently updated clients */
  clientPhones: ClientPhoneNumberConnection;
  /** List of 100 recently updated clients satisfying a filter, belonging to the account of the authenticated in Service Provider */
  clients: ClientConnection;
  /** List of 100 custom field configurations */
  customFieldConfigurations: CustomFieldConfigurationConnection;
  /** Single event by unique identifier, belonging to the account of the authenticated Service Provider */
  event?: Maybe<Event>;
  /** Single expense by unique identifier belonging to the account of the authenticated Service Provider */
  expense?: Maybe<Expense>;
  /** Connection of expenses belonging to the account of the authenticated Service Provider */
  expenses?: Maybe<ExpenseConnection>;
  /** List of external reminders for the account */
  externalReminders: ExternalReminderConnection;
  /** Single invoice by unique identifier belonging to the account of the authenticated in Service Provider */
  invoice?: Maybe<Invoice>;
  /** List of 100 recently updated invoices satisfying a filter, belonging to the account of the authenticated in Service Provider */
  invoices: InvoiceConnection;
  /** Single job by unique identifier belonging to the account of the authenticated in Service Provider */
  job?: Maybe<Job>;
  /** 100 recently updated jobs of the logged in account. */
  jobs: JobConnection;
  /** OnlineBookingConfiguration belonging to the account of the authenticated Service Provider */
  onlineBookingConfiguration?: Maybe<OnlineBookingConfiguration>;
  /** List of 100 Jobber Payments payment methods */
  paymentMethods?: Maybe<PaymentMethodInterfaceConnection>;
  /** Single payment record by unique identifier belonging to the account of the authenticated in Service Provider */
  paymentRecord?: Maybe<PaymentRecordInterface>;
  /** List of 100 recently sent payment records satisfying a filter, belonging to the account of the authenticated in Service Provider */
  paymentRecords?: Maybe<PaymentRecordInterfaceConnection>;
  /** List of all possible refund reasons for a payment */
  paymentRefundReasons?: Maybe<Array<Scalars['String']['output']>>;
  /** The payout record resolver */
  payoutRecord?: Maybe<PayoutRecord>;
  /** The payout records resolver */
  payoutRecords: PayoutRecordConnection;
  /** Single product or service by unique identifier belonging to the account of the authenticated in Service Provider */
  product: ProductOrService;
  /**
   * List of 100 products or services, belonging to the account of the authenticated Service Provider
   * @deprecated Functionality duplicated by improved query, use `product` instead.
   */
  productOrService: ProductOrService;
  /**
   * List of 100 products or services, belonging to the account of the authenticated in Service Provider
   * @deprecated Functionality duplicated by improved query, use `products` instead.
   */
  productOrServices: ProductOrServiceConnection;
  /** List of 100 services and products. */
  products: ProductOrServiceConnection;
  /**
   * List of 100 products or services matching a search term
   * @deprecated Use `products` instead.
   */
  productsSearch: ProductOrServiceConnection;
  /** List of 100 recently updated properties, belonging to the account of the authenticated Service Provider */
  properties: PropertyConnection;
  /** Single property by unique identifier belonging to the account of the authenticated Service Provider */
  property?: Maybe<Property>;
  /** Single quote by unique identifier belonging to the account of the authenticated in Service Provider */
  quote?: Maybe<Quote>;
  /** List of 100 recently updated quotes satisfying a filter, belonging to the account of the authenticated in Service Provider */
  quotes: QuoteConnection;
  /** Single request by unique identifier belonging to the account of the authenticated in Service Provider */
  request?: Maybe<Request>;
  /** Request settings and details for the service provider's account */
  requestSettings?: Maybe<RequestSettings>;
  /** Request settings collection for the service provider's account */
  requestSettingsCollection: RequestSettingsConnection;
  /** 100 recently updated work requests of the logged in account. */
  requests: RequestConnection;
  /** All scheduled items (Basic Tasks, Visits, Events, Assessments, Quote Reminders, and Invoice Reminders) for a list of team members on a given day */
  scheduledItems: ScheduledItemInterfaceConnection;
  /** Find similar clients to the given client. This query will never return more than 10 items. */
  similarClients: ClientConnection;
  /** List of supplier invoice batches for the current account */
  supplierInvoiceBatches: SupplierInvoiceBatchConnection;
  /** Single task by unique identifier, belonging to the account of the authenticated Service Provider */
  task?: Maybe<Task>;
  /** A collection of sortable tasks. Default sorting order is on `START_AT`, by `ASCENDING` */
  tasks: TaskConnection;
  /** The different tax rates of the logged in account. */
  taxRates: TaxRateConnection;
  /** All timesheet entries for users on a given day */
  timeSheetEntries: TimeSheetEntryConnection;
  /** Time sheet entries grouped by job or label for a user and date range */
  timeSheetEntriesByGroup: TimeSheetEntryGroupConnection;
  /** Single timesheet entry by unique identifier belonging to the account of the authenticated in Service Provider */
  timeSheetEntry?: Maybe<TimeSheetEntry>;
  /** Single user by unique identifier belonging to the account of the authenticated Service Provider. When a unique identifier is not supplied, the current user is returned */
  user?: Maybe<User>;
  /** List of 10,000 users satisfying a filter, belonging to the account of the authenticated Service Provider */
  users: UserConnection;
  /** Single vehicle by unique identifier belonging to the authenticated account */
  vehicle?: Maybe<Vehicle>;
  /** Retrieves vehicles for the authenticated account */
  vehicles: VehicleConnection;
  /** Single visit by unique identifier associated with a Job, belonging to the account of the authenticated Service Provider */
  visit?: Maybe<Visit>;
  /** A collection of sortable visits. Default sorting order is on `START_AT`, by `ASCENDING` */
  visits: VisitConnection;
  /** Internal query to retrieve payload sent to external developer when a web hook event is triggered */
  webHookEvent: WebHookPayload;
  /**
   * Initialize work items for line items
   * @deprecated Use `products` instead
   */
  workItemSearch: Array<WorkItem>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryAppAlertsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryAppsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryAssessmentArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryCapitalLoansArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<CapitalLoanFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryClientArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryClientEmailsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryClientMetaArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryClientPhoneArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryClientPhonesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ClientPhoneFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryClientsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ClientFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  searchFields?: InputMaybe<Array<ClientSearchField>>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<ClientsSortInput>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryCustomFieldConfigurationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<CustomFieldConfigurationsFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<CustomFieldConfigurationsSortInput>>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryEventArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryExpenseArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryExpensesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ExpenseFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<ExpensesSortInput>>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryExternalRemindersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sourceType?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryInvoiceArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryInvoicesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<InvoiceFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InvoiceSortInput>>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryJobArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryJobsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<JobFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<JobsSortInput>>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryPaymentMethodsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<JobberPaymentsPaymentMethodFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryPaymentRecordArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryPaymentRecordsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<PaymentRecordFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<PaymentRecordSortAttributes>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryPayoutRecordArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryPayoutRecordsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<PayoutFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<PayoutSortInput>>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryProductArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryProductOrServiceArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryProductOrServicesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryProductsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ProductsFilterInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryProductsSearchArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  searchTerm: Scalars['String']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryPropertiesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<PropertiesFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryPropertyArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryQuoteArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryQuotesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<QuoteFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<QuotesSortInput>>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryRequestArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryRequestSettingsArgs = {
  id?: InputMaybe<Scalars['EncodedId']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryRequestSettingsCollectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<RequestSettingsFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryRequestsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<RequestFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<RequestsSortInput>>;
  timezone?: InputMaybe<Scalars['Timezone']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryScheduledItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter: ScheduledItemsFilterAttributes;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<ScheduledItemsSortInput>;
};


/** The query root of Jobber's GraphQL interface. */
export type QuerySimilarClientsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  companyName?: InputMaybe<Scalars['String']['input']>;
  emails?: InputMaybe<Array<Scalars['String']['input']>>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QuerySupplierInvoiceBatchesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryTaskArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryTasksArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<TaskFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<TaskSortInput>>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryTaxRatesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryTimeSheetEntriesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<TimeSheetEntriesFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<TimeSheetEntriesSortAttributes>>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryTimeSheetEntriesByGroupArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter: TimeSheetEntryGroupsFilterAttributes;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryTimeSheetEntryArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryUserArgs = {
  id?: InputMaybe<Scalars['EncodedId']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<UsersFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<UsersSortInput>>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryVehicleArgs = {
  vehicleId: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryVehiclesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryVisitArgs = {
  id: Scalars['EncodedId']['input'];
};


/** The query root of Jobber's GraphQL interface. */
export type QueryVisitsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<VisitFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<VisitsSortInput>>;
  timezone?: InputMaybe<Scalars['Timezone']['input']>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryWebHookEventArgs = {
  accountId: Scalars['EncodedId']['input'];
  itemId: Scalars['EncodedId']['input'];
  occuredAt: Scalars['ISO8601DateTime']['input'];
  webHookId: Scalars['EncodedId']['input'];
  webhookType?: InputMaybe<Webhook>;
};


/** The query root of Jobber's GraphQL interface. */
export type QueryWorkItemSearchArgs = {
  maxResults?: InputMaybe<Scalars['Int']['input']>;
  searchTerm: Scalars['String']['input'];
};

/** A cost estimate of work which Service Providers send to their clients before any work is done */
export type Quote = CustomFieldsInterface & {
  __typename?: 'Quote';
  /** All amounts related to the quote */
  amounts: QuoteAmounts;
  /** The client the quote was made for */
  client?: Maybe<Client>;
  /** The URI of the quote in client hub */
  clientHubUri?: Maybe<Scalars['String']['output']>;
  /** Time the quote was viewed at in Client Hub */
  clientHubViewedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The contract disclaimer for the quote */
  contractDisclaimer?: Maybe<Scalars['String']['output']>;
  /**
   * The total cost of the quote provided to the Service Client
   * @deprecated Renamed to `total` and moved to the `amounts` section
   */
  cost: Scalars['Float']['output'];
  /** The time the quote was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The custom fields set for this object */
  customFields: Array<CustomFieldUnion>;
  /** Paid deposit amount that is not yet associated with an invoice */
  depositAmountUnallocated?: Maybe<Scalars['Float']['output']>;
  /**
   * Has at least one deposit been collected?
   * @deprecated This field does not take into account refunded deposits. Use the outstandingDepositAmount field under amounts instead.
   */
  depositCollected: Scalars['Boolean']['output'];
  /** The deposit records applied to the quote */
  depositRecords: PaymentRecordConnection;
  /** Indicates if the quote is eligible for Wisetack financing offers */
  eligibleForFinancing: Scalars['Boolean']['output'];
  /** Whether the quote has any deposit records with refundable surcharge amounts */
  hasRefundableSurchargePayments: Scalars['Boolean']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The URI for the given record in Jobber Online */
  jobberWebUri: Scalars['String']['output'];
  /** Job IDs converted from this quote */
  jobs?: Maybe<JobConnection>;
  /** The last transitioned dates of a quote */
  lastTransitioned: QuoteLastTransitioned;
  /** The line items associated with the quote */
  lineItems: QuoteLineItemConnection;
  /** All messages related to this work object. */
  linkedCommunications: MessageInterfaceConnection;
  /** The message to the client */
  message?: Maybe<Scalars['String']['output']>;
  /** The note files attached to the quote */
  noteAttachments: QuoteNoteFileConnection;
  /** The notes attached to the quote */
  notes: QuoteNoteUnionConnection;
  /** The property the quote was made for */
  property?: Maybe<Property>;
  /** A non-unique number assigned to the quote by a Service Provider */
  quoteNumber: Scalars['String']['output'];
  /** The current status the quote */
  quoteStatus: QuoteStatusTypeEnum;
  /** The request associated with the quote */
  request?: Maybe<Request>;
  /** Salesperson for the quote */
  salesperson?: Maybe<User>;
  /** The time a quote was last sent to the Service Client */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The tax rate and amount details */
  taxDetails?: Maybe<TaxDetails>;
  /**
   * The tax rate of the quote
   * @deprecated Use tax_details field instead
   */
  taxRate?: Maybe<TaxRate>;
  /** The description of the quote */
  title?: Maybe<Scalars['String']['output']>;
  /** Time the quote transitioned to its current status */
  transitionedAt: Scalars['ISO8601DateTime']['output'];
  /** The deposit records that haven't been applied to an invoice and have not been refunded */
  unallocatedDepositRecords: PaymentRecordConnection;
  /** The last time the quote was changed in a way that is meaningful to the Service Provider */
  updatedAt: Scalars['ISO8601DateTime']['output'];
};


/** A cost estimate of work which Service Providers send to their clients before any work is done */
export type QuoteDepositRecordsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<PaymentRecordFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A cost estimate of work which Service Providers send to their clients before any work is done */
export type QuoteJobsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<QuoteJobsSortInput>>;
};


/** A cost estimate of work which Service Providers send to their clients before any work is done */
export type QuoteLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<QuoteLineItemFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A cost estimate of work which Service Providers send to their clients before any work is done */
export type QuoteLinkedCommunicationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A cost estimate of work which Service Providers send to their clients before any work is done */
export type QuoteNoteAttachmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<NoteAttachmentFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<NoteAttachmentSortAttributes>>;
};


/** A cost estimate of work which Service Providers send to their clients before any work is done */
export type QuoteNotesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<NotesSortInput>>;
};


/** A cost estimate of work which Service Providers send to their clients before any work is done */
export type QuoteUnallocatedDepositRecordsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** All amounts related to a quote */
export type QuoteAmounts = {
  __typename?: 'QuoteAmounts';
  /** The deposit amount */
  depositAmount: Scalars['Float']['output'];
  /** The discount amount */
  discountAmount: Scalars['Float']['output'];
  /** The non-tax amount including the line items which are exempted from the tax */
  nonTaxAmount: Scalars['Float']['output'];
  /** The remaining balance of the quote deposit yet to be collected */
  outstandingDepositAmount: Scalars['Float']['output'];
  /** The subtotal including line item costs but excluding tax amounts */
  subtotal: Scalars['Float']['output'];
  /** The tax amount */
  taxAmount: Scalars['Float']['output'];
  /** The total cost of the invoice or quote, including line item costs and tax amounts */
  total: Scalars['Float']['output'];
};

/** Input arguments for a client's view option settings for a quote */
export type QuoteClientViewOptionsInput = {
  /** Setting to show the client quote line item quantities */
  showLineItemQty: Scalars['Boolean']['input'];
  /** Setting to show the client quote line item total costs */
  showLineItemTotalCosts: Scalars['Boolean']['input'];
  /** Setting to show the client quote line item unit costs */
  showLineItemUnitCosts: Scalars['Boolean']['input'];
  /** Setting to show the client quote totals */
  showTotals: Scalars['Boolean']['input'];
};

/** The connection type for Quote. */
export type QuoteConnection = {
  __typename?: 'QuoteConnection';
  /** A list of edges. */
  edges?: Maybe<Array<QuoteEdge>>;
  /** A list of nodes. */
  nodes: Array<Quote>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** Attributes for creating a new quote */
export type QuoteCreateAttributes = {
  /** Whether to allow ach payments or not */
  allowClientHubAchPayments?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether to allow credit card payments or not */
  allowClientHubCreditCardPayments?: InputMaybe<Scalars['Boolean']['input']>;
  /** The ID of the client the quote is made for */
  clientId: Scalars['EncodedId']['input'];
  /** The client view options for the quote */
  clientViewOptions?: InputMaybe<QuoteClientViewOptionsInput>;
  /** The contract disclaimer for the quote */
  contractDisclaimer?: InputMaybe<Scalars['String']['input']>;
  /** List of custom fields to add */
  customFields?: InputMaybe<Array<CustomFieldCreateInput>>;
  /** The required deposit on this quote */
  deposit?: InputMaybe<CostModifierAttributes>;
  /** The discount applied to this quote */
  discount?: InputMaybe<CostModifierAttributes>;
  /** The line items associated with the quote */
  lineItems: Array<QuoteCreateLineItemAttributes>;
  /** Whether a mandatory payment method on file is required */
  mandatoryPaymentMethodOnFile?: InputMaybe<Scalars['Boolean']['input']>;
  /** The client message for the quote */
  message?: InputMaybe<Scalars['String']['input']>;
  /** The notes to be added to the quote */
  notes?: InputMaybe<Array<QuoteCreateNoteInput>>;
  /** The processor that processed the quote creation (e.g., 'Task') */
  processedBy?: InputMaybe<Processor>;
  /** The ID of the property the quote is made for */
  propertyId: Scalars['EncodedId']['input'];
  /** A non-unique number assigned to the quote by a Service Provider */
  quoteNumber?: InputMaybe<Scalars['Int']['input']>;
  /** The ID of the request associated with the quote */
  requestId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The salesperson for this quote */
  salespersonId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The tax rate on this quote */
  taxRateId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The description of the quote */
  title?: InputMaybe<Scalars['String']['input']>;
  /** Transition the quote to this status after creation */
  transitionQuoteTo?: InputMaybe<QuoteTransitionOnCreate>;
};

/** Attributes for creating a new line item in quotes */
export type QuoteCreateLineItemAttributes = {
  /** The category of the line item */
  category?: InputMaybe<ProductsAndServicesCategory>;
  /** The description of the line item */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The name of the line item */
  name: Scalars['String']['input'];
  /** Is the line item considered optional? */
  optional?: InputMaybe<Scalars['Boolean']['input']>;
  /** The unique identifier of the linked product or service */
  productOrServiceId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The quantity of the line item */
  quantity?: InputMaybe<Scalars['Float']['input']>;
  /** When the line item is optional, is it recommended (defaulting to chosen by the client) */
  recommended?: InputMaybe<Scalars['Boolean']['input']>;
  /** Save a copy of the new line item to products and services for future use */
  saveToProductsAndServices: Scalars['Boolean']['input'];
  /** Is the line item taxable */
  taxable?: InputMaybe<Scalars['Boolean']['input']>;
  /** Is the line item text only? */
  textOnly?: InputMaybe<Scalars['Boolean']['input']>;
  /** The total price of the line item */
  totalPrice?: InputMaybe<Scalars['Float']['input']>;
  /** The unit cost of the line item, for margin purposes */
  unitCost?: InputMaybe<Scalars['Float']['input']>;
  /** The unit price of the line item */
  unitPrice?: InputMaybe<Scalars['Float']['input']>;
};

/** Autogenerated return type of QuoteCreateLineItems. */
export type QuoteCreateLineItemsPayload = {
  __typename?: 'QuoteCreateLineItemsPayload';
  /** The added line items */
  createdLineItems?: Maybe<Array<QuoteLineItem>>;
  /** The related quote */
  quote?: Maybe<Quote>;
  /** Errors encountered when modifying the quote */
  userErrors: Array<MutationErrors>;
};

/** Attributes for creating a quote note */
export type QuoteCreateNoteInput = {
  /** List of attachments to be added to the note */
  attachments?: InputMaybe<Array<NoteAttachmentAttributes>>;
  /** Which objects this quote note should be linked to */
  linkedTo?: InputMaybe<QuoteNoteLinkInput>;
  /** The message to be placed on the note */
  message?: InputMaybe<Scalars['String']['input']>;
  /** Whether the note should be pinned */
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Autogenerated return type of QuoteCreateNote. */
export type QuoteCreateNotePayload = {
  __typename?: 'QuoteCreateNotePayload';
  /** The quote the note is attached to */
  quote?: Maybe<Quote>;
  /** The newly created note */
  quoteNote?: Maybe<QuoteNote>;
  /** Errors encountered during note creation */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of QuoteCreate. */
export type QuoteCreatePayload = {
  __typename?: 'QuoteCreatePayload';
  /** The created quote */
  quote?: Maybe<Quote>;
  /** Errors encountered when creating the quote */
  userErrors: Array<MutationErrors>;
};

/** Attributes for creating a new text line item in quotes */
export type QuoteCreateTextLineItemAttributes = {
  /** The category of the text line item */
  category?: InputMaybe<ProductsAndServicesCategory>;
  /** The description of the text line item */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The name of the text line item */
  name: Scalars['String']['input'];
};

/** Autogenerated return type of QuoteCreateTextLineItems. */
export type QuoteCreateTextLineItemsPayload = {
  __typename?: 'QuoteCreateTextLineItemsPayload';
  /** The added line items */
  createdLineItems?: Maybe<Array<QuoteLineItem>>;
  /** The related quote */
  quote?: Maybe<Quote>;
  /** Errors encountered when modifying the quote */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of QuoteDeleteLineItems. */
export type QuoteDeleteLineItemsPayload = {
  __typename?: 'QuoteDeleteLineItemsPayload';
  /** The line items which have been deleted successfully */
  deletedLineItems: Array<QuoteLineItem>;
  /** The quotes modified when deleting line items */
  quote?: Maybe<Quote>;
  /** Errors encountered when modifying the quote */
  userErrors: Array<MutationErrors>;
};

/** An edge in a connection. */
export type QuoteEdge = {
  __typename?: 'QuoteEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Quote;
};

/** Attributes for modifying an existing quote */
export type QuoteEditAttributes = {
  /** Whether to allow ach payments or not */
  allowClientHubAchPayments?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether to allow credit card payments or not */
  allowClientHubCreditCardPayments?: InputMaybe<Scalars['Boolean']['input']>;
  /** The client view options for the quote */
  clientViewOptions?: InputMaybe<QuoteClientViewOptionsInput>;
  /** The contract disclaimer for the quote */
  contractDisclaimer?: InputMaybe<Scalars['String']['input']>;
  /** List of custom fields to modify or add */
  customFields?: InputMaybe<Array<CustomFieldEditInput>>;
  /** The deposit required by this quote. To remove the deposit, set the rate to 0. */
  deposit?: InputMaybe<CostModifierAttributes>;
  /** The discount applied to this quote. To remove the discount, set the rate to 0. */
  discount?: InputMaybe<CostModifierAttributes>;
  /** Whether a mandatory payment method on file is required */
  mandatoryPaymentMethodOnFile?: InputMaybe<Scalars['Boolean']['input']>;
  /** The message for the client on the quote */
  message?: InputMaybe<Scalars['String']['input']>;
  /** The non-unique number assigned to the quote */
  quoteNumber?: InputMaybe<Scalars['String']['input']>;
  /** The salesperson for this quote */
  salespersonId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The date and time the quote was last sent */
  sentAt?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
  /** The id of tax on the quote */
  taxRateId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The title of the quote */
  title?: InputMaybe<Scalars['String']['input']>;
};

/** Attributes for modifying an existing line items on an existing quote */
export type QuoteEditLineItemAttributes = {
  /** The category of the line item */
  category?: InputMaybe<ProductsAndServicesCategory>;
  /** The description of the line item */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The attached image to be added to the line item */
  image?: InputMaybe<FileAttachmentAttributes>;
  /** The unique identifier of the line item */
  lineItemId: Scalars['EncodedId']['input'];
  /** The name of the line item */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Is the line item considered optional? */
  optional?: InputMaybe<Scalars['Boolean']['input']>;
  /** The unique identifier of the linked product or service */
  productOrServiceId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The quantity of the line item */
  quantity?: InputMaybe<Scalars['Float']['input']>;
  /** When the line item is optional, is it recommended (defaulting to chosen by the client) */
  recommended?: InputMaybe<Scalars['Boolean']['input']>;
  /** The order of the line item */
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
  /** Is the line item taxable */
  taxable?: InputMaybe<Scalars['Boolean']['input']>;
  /** The total price of the line item */
  totalPrice?: InputMaybe<Scalars['Float']['input']>;
  /** The unit cost of the line item. */
  unitCost?: InputMaybe<Scalars['Float']['input']>;
  /** The unit price of the line item */
  unitPrice?: InputMaybe<Scalars['Float']['input']>;
};

/** Autogenerated return type of QuoteEditLineItems. */
export type QuoteEditLineItemsPayload = {
  __typename?: 'QuoteEditLineItemsPayload';
  /** The modified line items */
  modifiedLineItems?: Maybe<Array<QuoteLineItem>>;
  /** The quote */
  quote?: Maybe<Quote>;
  /** Errors encountered when modifying the quote */
  userErrors: Array<MutationErrors>;
};

/** Attributes for editing an existing quote note */
export type QuoteEditNoteInput = {
  /** List of attachments to append to the note */
  attachmentsToAdd?: InputMaybe<Array<NoteAttachmentAttributes>>;
  /** List of attachments to delete from the note */
  attachmentsToDelete?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** Which objects this note should be linked to */
  linkedTo?: InputMaybe<QuoteNoteLinkInput>;
  /** The new message to place on the note */
  message?: InputMaybe<Scalars['String']['input']>;
  /** The unique identifier of the note */
  noteId: Scalars['EncodedId']['input'];
  /** Whether the note should be pinned */
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Autogenerated return type of QuoteEditNote. */
export type QuoteEditNotePayload = {
  __typename?: 'QuoteEditNotePayload';
  /** The quote the note is attached to */
  quote?: Maybe<Quote>;
  /** The edited note */
  quoteNote?: Maybe<QuoteNote>;
  /** Errors encountered during note edit */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of QuoteEdit. */
export type QuoteEditPayload = {
  __typename?: 'QuoteEditPayload';
  /** The modified quote */
  quote?: Maybe<Quote>;
  /** Errors encountered when modifying the quote */
  userErrors: Array<MutationErrors>;
};

/** Attributes for filtering quotes */
export type QuoteFilterAttributes = {
  /** The encoded id of the client to filter by */
  clientId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The quote cost to filter by */
  cost?: InputMaybe<FloatRangeInput>;
  /** The quote created at date to filter by */
  createdAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The quote number to filter by */
  quoteNumber?: InputMaybe<IntRangeInput>;
  /** The encoded id of the salesperson to filter by */
  salespersonId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The quote sent at date to filter by */
  sentAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The quote status to filter by */
  status?: InputMaybe<QuoteStatusTypeEnum>;
  /** The quote updated at date to filter by */
  updatedAt?: InputMaybe<Iso8601DateTimeRangeInput>;
};

/** The input arguments used to sort QuoteJobs */
export type QuoteJobsSortInput = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The field to sort on */
  key: QuoteJobsSortKey;
};

/** The fields on which quote jobs support sorting functionality */
export type QuoteJobsSortKey =
  /** Time the Job was updated at */
  | 'UPDATED_AT';

/** The last transitioned dates of a quote */
export type QuoteLastTransitioned = {
  __typename?: 'QuoteLastTransitioned';
  /** The date the quote was last approved */
  approvedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The date the quote was last requested for changes */
  changesRequestedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The date the quote was last converted */
  convertedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};

/** A quote line item */
export type QuoteLineItem = LineItemInterface & {
  __typename?: 'QuoteLineItem';
  /** The category of the line item */
  category: ProductsAndServicesCategory;
  /**
   * The price of the line item
   * @deprecated Use `total_price` instead
   */
  cost: Scalars['Float']['output'];
  /** The DateTime the line item was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The description of the line item */
  description: Scalars['String']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The product or service from the Service Providers saved Products and Services list that was used to create this line item */
  linkedProductOrService?: Maybe<ProductOrService>;
  /** The markup of the line item */
  markup?: Maybe<Scalars['Float']['output']>;
  /** The name of the line item */
  name: Scalars['String']['output'];
  /** Is the line item considered optional? */
  optional: Scalars['Boolean']['output'];
  /**
   * The quantity of the line item
   * @deprecated Use `quantity` field
   */
  qty: Scalars['Float']['output'];
  /** The quantity of the line item */
  quantity: Scalars['Float']['output'];
  /** When the line item is optional, is it recommended or has it been selected to be included by the client? */
  recommended?: Maybe<Scalars['Boolean']['output']>;
  /**
   * Has the client chosen this optional line item?
   * @deprecated Use `recommended` instead!
   */
  selected?: Maybe<Scalars['Boolean']['output']>;
  /** The sort order of the line item */
  sortOrder?: Maybe<Scalars['Int']['output']>;
  /** If the line item is taxable */
  taxable: Scalars['Boolean']['output'];
  /** Is the line item text only (doesn't include quantity and price information) */
  textOnly: Scalars['Boolean']['output'];
  /** The total cost of the line item */
  totalCost?: Maybe<Scalars['Float']['output']>;
  /** The total price of the line item */
  totalPrice: Scalars['Float']['output'];
  /** The unit cost of the quote line item */
  unitCost?: Maybe<Scalars['Float']['output']>;
  /** The unit price of the line item */
  unitPrice: Scalars['Float']['output'];
  /** The last DateTime the line item was changed in a way that is meaningful to the Service Provider */
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

/** The connection type for QuoteLineItem. */
export type QuoteLineItemConnection = {
  __typename?: 'QuoteLineItemConnection';
  /** A list of edges. */
  edges?: Maybe<Array<QuoteLineItemEdge>>;
  /** A list of nodes. */
  nodes: Array<QuoteLineItem>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type QuoteLineItemEdge = {
  __typename?: 'QuoteLineItemEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: QuoteLineItem;
};

/** Filter options for Quote line items */
export type QuoteLineItemFilterAttributes = {
  /** The line items that are marked as required or optional and selected */
  approved?: InputMaybe<Scalars['Boolean']['input']>;
};

/** A quote note */
export type QuoteNote = NoteInterface & {
  __typename?: 'QuoteNote';
  /** When the note was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The user or app that created the note */
  createdBy?: Maybe<NoteCreatedByUnion>;
  /** The attached note files */
  fileAttachments: NoteFileInterfaceConnection;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** When the note was last updated by a user */
  lastEditedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The last user to edit the note */
  lastEditedBy?: Maybe<User>;
  /** What objects (client, quote, job, etc.) the note is linked to */
  linkedTo: NoteLink;
  /** The note message */
  message: Scalars['String']['output'];
  /** Whether the note is pinned */
  pinned: Scalars['Boolean']['output'];
};


/** A quote note */
export type QuoteNoteFileAttachmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<NoteAttachmentFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<NoteAttachmentSortAttributes>>;
};

/** A file attached to a note */
export type QuoteNoteFile = NoteFileInterface & {
  __typename?: 'QuoteNoteFile';
  /** The type of the file */
  contentType: Scalars['String']['output'];
  /** The time the note file attachment was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The name of the file */
  fileName: Scalars['String']['output'];
  /** The size of the file in bytes */
  fileSize: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The note this attachment is attached to */
  note: QuoteNoteUnion;
  /** The possible statuses for the file */
  status: NoteFileStatusEnum;
  /** The location of the thumbnail */
  thumbnailUrl: Scalars['String']['output'];
  /** The time the note file attachment was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** The location of the file */
  url: Scalars['String']['output'];
};

/** The connection type for QuoteNoteFile. */
export type QuoteNoteFileConnection = {
  __typename?: 'QuoteNoteFileConnection';
  /** A list of edges. */
  edges?: Maybe<Array<QuoteNoteFileEdge>>;
  /** A list of nodes. */
  nodes: Array<QuoteNoteFile>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type QuoteNoteFileEdge = {
  __typename?: 'QuoteNoteFileEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: QuoteNoteFile;
};

/** Attributes for linking quote notes */
export type QuoteNoteLinkInput = {
  /** Whether the note should be linked to related invoices */
  invoices?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether the note should be linked to related jobs */
  jobs?: InputMaybe<Scalars['Boolean']['input']>;
};

export type QuoteNoteUnion = ClientNote | QuoteNote | RequestNote;

/** The connection type for QuoteNoteUnion. */
export type QuoteNoteUnionConnection = {
  __typename?: 'QuoteNoteUnionConnection';
  /** A list of edges. */
  edges?: Maybe<Array<QuoteNoteUnionEdge>>;
  /** A list of nodes. */
  nodes: Array<QuoteNoteUnion>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type QuoteNoteUnionEdge = {
  __typename?: 'QuoteNoteUnionEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: QuoteNoteUnion;
};

export type QuoteStatusTypeEnum =
  /** The state when a quote is approved by a client */
  | 'approved'
  /** The state when a quote is archived */
  | 'archived'
  /** The state when the quote is sent to a client */
  | 'awaiting_response'
  /** The state when a client request changes to the quote */
  | 'changes_requested'
  /** The state when a quote is converted to a job */
  | 'converted'
  /** The default state of a quote */
  | 'draft';

/** Valid quote status transitions available when creating a quote */
export type QuoteTransitionOnCreate =
  /** Transition the quote to awaiting response (sent to client) */
  | 'AWAITING_RESPONSE';

/** The attributes to sort on a collection of quotes */
export type QuotesSortInput = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The key to sort on */
  key: QuotesSortKey;
};

/** The fields, or associated fields, on a collection of quotes which support sorting functionality */
export type QuotesSortKey =
  /** Sort by the last date the client approved the quote */
  | 'APPROVED_AT'
  /** Sort by the last date the quote was archived */
  | 'ARCHIVED_AT'
  /** Sort by the client's first name, or company name if the client represents a business */
  | 'CLIENT_FIRST_NAME'
  /** Sort by the client's last name, or company name if the client represents a business */
  | 'CLIENT_LAST_NAME'
  /** Sort by the client's company name if the client represents a business, first name if present, or last name if present */
  | 'CLIENT_PRIMARY_NAME'
  /** Sort by the last date the quote was converted to a job */
  | 'CONVERTED_AT'
  /** Sort by the date the quotes were created */
  | 'CREATED_AT'
  /** Sort by the date the quote was last sent back by the client */
  | 'LAST_CHANGES_REQUESTED_AT'
  /** Sort by the date the quote was last sent to the client */
  | 'LAST_SENT_AT'
  /** The field which shows the first line of the street address for the property on the quote */
  | 'PROPERTY_STREET1'
  /** Sort by the quote number */
  | 'QUOTE_NUMBER'
  /** Sort by the quote status in workflow order */
  | 'QUOTE_STATUS'
  /** Sort by quote total value */
  | 'QUOTE_TOTAL';

/** Recurrence details for a repeating event */
export type RecurrenceSchedule = {
  __typename?: 'RecurrenceSchedule';
  /** iCalendar Recurrence Rule */
  calendarRule: Scalars['ICalendarRule']['output'];
  /** Human readable string describing the schedule's recurrence. Ex. Weekly on Sundays */
  friendly: Scalars['String']['output'];
};

/** A Refund Balance Transaction */
export type RefundBalanceTransaction = BalanceTransactionInterface & {
  __typename?: 'RefundBalanceTransaction';
  /** The date the balance transaction was created */
  created: Scalars['ISO8601DateTime']['output'];
  /** The type of currency used */
  currency: Scalars['String']['output'];
  /** The balance transaction fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The balance transaction gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The balance transaction net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The payment record associated with */
  paymentRecord?: Maybe<PaymentRecordInterface>;
  /** The balance transaction tip amount in cents */
  tipAmount?: Maybe<Scalars['Int']['output']>;
  /** The balance transaction type */
  type?: Maybe<BalanceTransaction>;
};

/** A Refund Fee Balance Transaction */
export type RefundFeeBalanceTransaction = BalanceTransactionInterface & {
  __typename?: 'RefundFeeBalanceTransaction';
  /** The date the balance transaction was created */
  created: Scalars['ISO8601DateTime']['output'];
  /** The type of currency used */
  currency: Scalars['String']['output'];
  /** The balance transaction fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The balance transaction gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The balance transaction net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The balance transaction type */
  type?: Maybe<BalanceTransaction>;
};

export type ReportDisplayLink = {
  /** The text to display for the uri */
  displayText: Scalars['String']['output'];
  /** The URI for the given record in Jobber Online */
  jobberWebUri: Scalars['String']['output'];
};

/** A request which a client will create when they wish to enlist the help of a Service Provider for work */
export type Request = {
  __typename?: 'Request';
  /** The time window during which the SP can arrive at the assessment associated with the work request */
  arrivalWindow?: Maybe<ArrivalWindow>;
  /** The assessment associated with the work request */
  assessment?: Maybe<Assessment>;
  /** The client associated with the work request */
  client: Client;
  /** The company name provided in the work request */
  companyName?: Maybe<Scalars['String']['output']>;
  /** The primary contact of the client requesting work */
  contactName?: Maybe<Scalars['String']['output']>;
  /** The time the work request was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The contact email provided in the work request */
  email?: Maybe<Scalars['String']['output']>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** Whether the work request can be archived */
  isArchivable: Scalars['Boolean']['output'];
  /** Whether the work request is scheduled */
  isScheduled: Scalars['Boolean']['output'];
  /** The URI for the given record in Jobber Online */
  jobberWebUri: Scalars['String']['output'];
  /** The jobs associated with the specific work request */
  jobs: JobConnection;
  /** The line items associated with the work request */
  lineItems?: Maybe<RequestLineItemConnection>;
  /** The note files attached to the request */
  noteAttachments: RequestNoteFileConnection;
  /** The notes attached to the request */
  notes: RequestNoteUnionConnection;
  /** The contact phone provided in the work request */
  phone?: Maybe<Scalars['String']['output']>;
  /** The property associated with the work request */
  property?: Maybe<Property>;
  /** The quotes associated with the work request */
  quotes: QuoteConnection;
  /** The client that referred this work request, if this work request was referred */
  referringClient?: Maybe<Client>;
  /** The status of the work request */
  requestStatus: RequestStatusTypeEnum;
  /** Salesperson for the request */
  salesperson?: Maybe<User>;
  /** The source of the work request */
  source: Scalars['String']['output'];
  /** The title of the work request */
  title?: Maybe<Scalars['String']['output']>;
  /** The last time the work request was changed in a way that is meaningful to the Service Provider */
  updatedAt: Scalars['ISO8601DateTime']['output'];
};


/** A request which a client will create when they wish to enlist the help of a Service Provider for work */
export type RequestJobsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A request which a client will create when they wish to enlist the help of a Service Provider for work */
export type RequestLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A request which a client will create when they wish to enlist the help of a Service Provider for work */
export type RequestNoteAttachmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<NoteAttachmentFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<NoteAttachmentSortAttributes>>;
};


/** A request which a client will create when they wish to enlist the help of a Service Provider for work */
export type RequestNotesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<NotesSortInput>>;
};


/** A request which a client will create when they wish to enlist the help of a Service Provider for work */
export type RequestQuotesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** Autogenerated return type of RequestArchive. */
export type RequestArchivePayload = {
  __typename?: 'RequestArchivePayload';
  /** The archived request */
  request?: Maybe<Request>;
  /** Errors encountered when trying to archive the request */
  userErrors: Array<MutationErrors>;
};

/** The connection type for Request. */
export type RequestConnection = {
  __typename?: 'RequestConnection';
  /** A list of edges. */
  edges?: Maybe<Array<RequestEdge>>;
  /** A list of nodes. */
  nodes: Array<Request>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** Input for creating a new request */
export type RequestCreateInput = {
  /** The inputs for creating assessment */
  assessment?: InputMaybe<AssessmentCreateInput>;
  /** The ID of the client associated with the request */
  clientId: Scalars['EncodedId']['input'];
  /** The form template ids to attach to the request */
  formIds?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** The attributes for creating line items */
  lineItems?: InputMaybe<Array<RequestCreateLineItemAttributes>>;
  /** The ID of the property of the client, will default to last property is not selected */
  propertyId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The client that referred this work request, if this work request was referred */
  referringClientId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** Details for the new request, only to be provided by external apps */
  requestDetails?: InputMaybe<RequestDetailsInput>;
  /** The salesperson for this request */
  salespersonId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The title of the request */
  title?: InputMaybe<Scalars['String']['input']>;
};

/** Attributes for creating a new line item on a request */
export type RequestCreateLineItemAttributes = {
  /** The category of the line item */
  category?: InputMaybe<ProductsAndServicesCategory>;
  /** The description of the line item */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The name of the line item */
  name: Scalars['String']['input'];
  /** The unique identifier of the linked product or service */
  productOrServiceId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The quantity of the line item */
  quantity?: InputMaybe<Scalars['Float']['input']>;
  /** Save a copy of the new line item to products and services for future use */
  saveToProductsAndServices: Scalars['Boolean']['input'];
  /** The sort order of the line item */
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
  /** Is the line item taxable */
  taxable?: InputMaybe<Scalars['Boolean']['input']>;
  /** The total price of the line item */
  totalPrice?: InputMaybe<Scalars['Float']['input']>;
  /** The unit cost of the line item */
  unitCost?: InputMaybe<Scalars['Float']['input']>;
  /** The unit price of the line item */
  unitPrice?: InputMaybe<Scalars['Float']['input']>;
};

/** Autogenerated return type of RequestCreateLineItems. */
export type RequestCreateLineItemsPayload = {
  __typename?: 'RequestCreateLineItemsPayload';
  /** The added line items */
  lineItems?: Maybe<Array<RequestLineItem>>;
  /** The related request */
  request?: Maybe<Request>;
  /** Errors encountered when modifying the request */
  userErrors: Array<MutationErrors>;
};

/** Attributes for creating request notes */
export type RequestCreateNoteInput = {
  /** List of attachments to be added to the note */
  attachments?: InputMaybe<Array<NoteAttachmentAttributes>>;
  /** Which objects this request note should be linked to */
  linkedTo?: InputMaybe<RequestNoteLinkInput>;
  /** The message to be placed on the note */
  message?: InputMaybe<Scalars['String']['input']>;
  /** Whether the note should be pinned */
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Autogenerated return type of RequestCreateNote. */
export type RequestCreateNotePayload = {
  __typename?: 'RequestCreateNotePayload';
  /** The request the note is attached to */
  request?: Maybe<Request>;
  /** The newly created note */
  requestNote?: Maybe<RequestNote>;
  /** Errors encountered during note creation */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of RequestCreate. */
export type RequestCreatePayload = {
  __typename?: 'RequestCreatePayload';
  /** The created request */
  request?: Maybe<Request>;
  /** Errors encountered when creating the request */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of RequestDeleteLineItems. */
export type RequestDeleteLineItemsPayload = {
  __typename?: 'RequestDeleteLineItemsPayload';
  /** The line items which have been deleted successfully */
  lineItems?: Maybe<Array<RequestLineItem>>;
  /** The request modified when deleting line items */
  request?: Maybe<Request>;
  /** Errors encountered when modifying the request */
  userErrors: Array<MutationErrors>;
};

/** Input for request details */
export type RequestDetailsInput = {
  /** Form containing details */
  form: FormInput;
};

/** An edge in a connection. */
export type RequestEdge = {
  __typename?: 'RequestEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Request;
};

/** Attributes for modifying an existing work request */
export type RequestEditInput = {
  /** The property of the request, must belong to the same client as the request */
  propertyId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The client that referred this work request, if this work request was referred */
  referringClientId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The salesperson for this request */
  salespersonId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The title of the request */
  title?: InputMaybe<Scalars['String']['input']>;
};

/** Autogenerated return type of RequestEditJobForms. */
export type RequestEditJobFormsPayload = {
  __typename?: 'RequestEditJobFormsPayload';
  /** The request with updated forms */
  request?: Maybe<Request>;
  /** Errors encountered when updating the request */
  userErrors: Array<MutationErrors>;
};

/** Attributes for modifying an existing line item on a request */
export type RequestEditLineItemAttributes = {
  /** The category of the line item */
  category?: InputMaybe<ProductsAndServicesCategory>;
  /** The description of the line item */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The attached image to be added to the line item */
  image?: InputMaybe<FileAttachmentAttributes>;
  /** The unique identifier of the line item */
  lineItemId: Scalars['EncodedId']['input'];
  /** The name of the line item */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The unique identifier of the linked product or service */
  productOrServiceId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The quantity of the line item */
  quantity?: InputMaybe<Scalars['Float']['input']>;
  /** The order of the line item */
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
  /** Is the line item taxable */
  taxable?: InputMaybe<Scalars['Boolean']['input']>;
  /** The total price of the line item */
  totalPrice?: InputMaybe<Scalars['Float']['input']>;
  /** The unit cost of the line item */
  unitCost?: InputMaybe<Scalars['Float']['input']>;
  /** The unit price of the line item */
  unitPrice?: InputMaybe<Scalars['Float']['input']>;
};

/** Autogenerated return type of RequestEditLineItems. */
export type RequestEditLineItemsPayload = {
  __typename?: 'RequestEditLineItemsPayload';
  /** The modified line items */
  lineItems?: Maybe<Array<RequestLineItem>>;
  /** The request */
  request?: Maybe<Request>;
  /** Errors encountered when modifying the request */
  userErrors: Array<MutationErrors>;
};

/** Attributes for editing an existing request note */
export type RequestEditNoteInput = {
  /** List of attachments to append to the note */
  attachmentsToAdd?: InputMaybe<Array<NoteAttachmentAttributes>>;
  /** List of attachments to delete from the note */
  attachmentsToDelete?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** Which objects this note should be linked to */
  linkedTo?: InputMaybe<RequestNoteLinkInput>;
  /** The new message to place on the note */
  message?: InputMaybe<Scalars['String']['input']>;
  /** The unique identifier of the note */
  noteId: Scalars['EncodedId']['input'];
  /** Whether the note should be pinned */
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Autogenerated return type of RequestEditNote. */
export type RequestEditNotePayload = {
  __typename?: 'RequestEditNotePayload';
  /** The request the note is attached to */
  request?: Maybe<Request>;
  /** The edited note */
  requestNote?: Maybe<RequestNote>;
  /** Errors encountered during note edit */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of RequestEdit. */
export type RequestEditPayload = {
  __typename?: 'RequestEditPayload';
  /** The modified request */
  request?: Maybe<Request>;
  /** Errors encountered when modifying the request */
  userErrors: Array<MutationErrors>;
};

/** Attributes for filtering requests */
export type RequestFilterAttributes = {
  /** The encoded id of the user assigned to the request's assessment to filter by */
  assignedTo?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The encoded id of the client to filter by */
  clientId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The request updated at date to filter by */
  createdAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The encoded id of the property to filter by */
  propertyId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The status of the request to filter by */
  status?: InputMaybe<RequestStatusTypeEnum>;
  /** The request updated at date to filter by */
  updatedAt?: InputMaybe<Iso8601DateTimeRangeInput>;
};

/** The places where this request form is being used */
export type RequestFormAssignment =
  /** This form is used as the booking form for AI Receptionist */
  | 'AI_RECEPTIONIST_BOOKINGS'
  /** This form is used as the default booking form */
  | 'BOOKING_DEFAULT'
  /** This form is used as the booking form in client hub */
  | 'CLIENT_HUB_BOOKINGS'
  /** This form is used as the request form in client hub */
  | 'CLIENT_HUB_REQUESTS'
  /** This form is used for reservations through Google */
  | 'RESERVE_WITH_GOOGLE';

/** A request line item */
export type RequestLineItem = LineItemInterface & {
  __typename?: 'RequestLineItem';
  /** The category of the line item */
  category: ProductsAndServicesCategory;
  /**
   * The price of the line item
   * @deprecated Use `total_price` instead
   */
  cost: Scalars['Float']['output'];
  /** The DateTime the line item was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The description of the line item */
  description: Scalars['String']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The product or service from the Service Providers saved Products and Services list that was used to create this line item */
  linkedProductOrService?: Maybe<ProductOrService>;
  /** The name of the line item */
  name: Scalars['String']['output'];
  /**
   * The quantity of the line item
   * @deprecated Use `quantity` field
   */
  qty: Scalars['Float']['output'];
  /** The quantity of the line item */
  quantity: Scalars['Float']['output'];
  /** The sort order of the line item */
  sortOrder?: Maybe<Scalars['Int']['output']>;
  /** If the line item is taxable */
  taxable: Scalars['Boolean']['output'];
  /** The total cost of the line item */
  totalCost?: Maybe<Scalars['Float']['output']>;
  /** The total price of the line item */
  totalPrice: Scalars['Float']['output'];
  /** The unit cost of the line item */
  unitCost?: Maybe<Scalars['Float']['output']>;
  /** The unit price of the line item */
  unitPrice: Scalars['Float']['output'];
  /** The last DateTime the line item was changed in a way that is meaningful to the Service Provider */
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

/** The connection type for RequestLineItem. */
export type RequestLineItemConnection = {
  __typename?: 'RequestLineItemConnection';
  /** A list of edges. */
  edges?: Maybe<Array<RequestLineItemEdge>>;
  /** A list of nodes. */
  nodes: Array<RequestLineItem>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type RequestLineItemEdge = {
  __typename?: 'RequestLineItemEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: RequestLineItem;
};

/** A request note */
export type RequestNote = NoteInterface & {
  __typename?: 'RequestNote';
  /** When the note was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The user or app that created the note */
  createdBy?: Maybe<NoteCreatedByUnion>;
  /** The attached note files */
  fileAttachments: NoteFileInterfaceConnection;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** When the note was last updated by a user */
  lastEditedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The last user to edit the note */
  lastEditedBy?: Maybe<User>;
  /** What objects (client, quote, job, etc.) the note is linked to */
  linkedTo: NoteLink;
  /** The note message */
  message: Scalars['String']['output'];
  /** Whether the note is pinned */
  pinned: Scalars['Boolean']['output'];
};


/** A request note */
export type RequestNoteFileAttachmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<NoteAttachmentFilterAttributes>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<NoteAttachmentSortAttributes>>;
};

/** A file attached to a note */
export type RequestNoteFile = NoteFileInterface & {
  __typename?: 'RequestNoteFile';
  /** The type of the file */
  contentType: Scalars['String']['output'];
  /** The time the note file attachment was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The name of the file */
  fileName: Scalars['String']['output'];
  /** The size of the file in bytes */
  fileSize: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The note this attachment is attached to */
  note: RequestNoteUnion;
  /** The possible statuses for the file */
  status: NoteFileStatusEnum;
  /** The location of the thumbnail */
  thumbnailUrl: Scalars['String']['output'];
  /** The time the note file attachment was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** The location of the file */
  url: Scalars['String']['output'];
};

/** The connection type for RequestNoteFile. */
export type RequestNoteFileConnection = {
  __typename?: 'RequestNoteFileConnection';
  /** A list of edges. */
  edges?: Maybe<Array<RequestNoteFileEdge>>;
  /** A list of nodes. */
  nodes: Array<RequestNoteFile>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type RequestNoteFileEdge = {
  __typename?: 'RequestNoteFileEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: RequestNoteFile;
};

/** Attributes for linking request notes */
export type RequestNoteLinkInput = {
  /** Whether the note should be linked to related invoices */
  invoices?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether the note should be linked to related jobs */
  jobs?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether the note should be linked to related quotes */
  quotes?: InputMaybe<Scalars['Boolean']['input']>;
};

export type RequestNoteUnion = ClientNote | RequestNote;

/** The connection type for RequestNoteUnion. */
export type RequestNoteUnionConnection = {
  __typename?: 'RequestNoteUnionConnection';
  /** A list of edges. */
  edges?: Maybe<Array<RequestNoteUnionEdge>>;
  /** A list of nodes. */
  nodes: Array<RequestNoteUnion>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type RequestNoteUnionEdge = {
  __typename?: 'RequestNoteUnionEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: RequestNoteUnion;
};

/** Request form settings and templates */
export type RequestSettings = {
  __typename?: 'RequestSettings';
  /** The type of booking this form creates when it's submitted. */
  bookingType: BookingType;
  /** Prevent back-to-back appointments by adding a buffer time between appointments. This does not take into account the client's location */
  bufferDurationMinutes: Scalars['Minutes']['output'];
  /** Whether these request settings are the ones used for Google online booking */
  connectedToGoogle: Scalars['Boolean']['output'];
  /** Whether these request settings are the default for the account */
  default: Scalars['Boolean']['output'];
  /** The description of the request form */
  description?: Maybe<Scalars['String']['output']>;
  /** The earliest availability minutes */
  earliestAvailabilityMinutes: Scalars['Minutes']['output'];
  /** How to handle buffer time between appointments. none allows back-to-back appointments. */
  efficientSchedulingType: EfficientSchedulingType;
  /** The URL for the embeded version of the public work request form */
  embeddedRequestUrl?: Maybe<Scalars['String']['output']>;
  /** Whether the request settings are enabled or disabled. Disabled work requests will not be visible to clients. */
  enabled: Scalars['Boolean']['output'];
  /** The places where this request form is being used */
  formAssignments: Array<RequestFormAssignment>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The interval duration minutes */
  intervalDurationMinutes: Scalars['Minutes']['output'];
  /** Only show appointments that are within the indicated drive time of other appointments */
  maxDriveTimeMinutes: Scalars['Minutes']['output'];
  /** The name of the form */
  name?: Maybe<Scalars['String']['output']>;
  /** The HTML for the public work request form */
  requestEmbedScript?: Maybe<Scalars['String']['output']>;
  /** The URL for the public work request form */
  requestUrl?: Maybe<Scalars['String']['output']>;
  /** Whether submissions against the request settings require booking approval or not */
  requiresBookingApproval: Scalars['Boolean']['output'];
  /** Whether service areas are enabled */
  serviceAreasEnabled: Scalars['Boolean']['output'];
  /** The description of the success message */
  successMessageDescription?: Maybe<Scalars['String']['output']>;
  /** The title of the success message */
  successMessageTitle?: Maybe<Scalars['String']['output']>;
  /** The URL of the success page */
  successUrl?: Maybe<Scalars['String']['output']>;
};

/** The connection type for RequestSettings. */
export type RequestSettingsConnection = {
  __typename?: 'RequestSettingsConnection';
  /** A list of edges. */
  edges?: Maybe<Array<RequestSettingsEdge>>;
  /** A list of nodes. */
  nodes: Array<RequestSettings>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type RequestSettingsEdge = {
  __typename?: 'RequestSettingsEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: RequestSettings;
};

/** Attributes for filtering request settings */
export type RequestSettingsFilterAttributes = {
  /** Filter to only include bookable request settings */
  bookingEnabled?: InputMaybe<Scalars['Boolean']['input']>;
};

export type RequestStatusTypeEnum =
  /** Archived */
  | 'archived'
  /** Assessment completed */
  | 'assessment_completed'
  /** Completed */
  | 'completed'
  /** Converted */
  | 'converted'
  /** New */
  | 'new'
  /** Overdue */
  | 'overdue'
  /** Today */
  | 'today'
  /** Unscheduled */
  | 'unscheduled'
  /** Upcoming */
  | 'upcoming';

/** Autogenerated return type of RequestUnarchive. */
export type RequestUnarchivePayload = {
  __typename?: 'RequestUnarchivePayload';
  /** The archived request */
  request?: Maybe<Request>;
  /** Errors encountered when trying to unarchive the request */
  userErrors: Array<MutationErrors>;
};

/** A union of "work objects," defined as requests, quotes, jobs, invoices and treatments. */
export type RequestedWorkObjectUnion = Invoice | Job | Quote | Request;

/** The connection type for RequestedWorkObjectUnion. */
export type RequestedWorkObjectUnionConnection = {
  __typename?: 'RequestedWorkObjectUnionConnection';
  /** A list of edges. */
  edges?: Maybe<Array<RequestedWorkObjectUnionEdge>>;
  /** A list of nodes. */
  nodes: Array<RequestedWorkObjectUnion>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type RequestedWorkObjectUnionEdge = {
  __typename?: 'RequestedWorkObjectUnionEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: RequestedWorkObjectUnion;
};

/** Attributes for filtering requested work objects */
export type RequestedWorkObjectsFilterAttributes = {
  /** The encoded ids of the properties to filter by */
  propertyIds?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** Filter by lifecycle status. ACTIVE excludes completed jobs, archived/converted quotes, bad debt/paid invoices, and converted/archived requests. Does not affect treatments. Defaults to ALL when omitted. */
  status?: InputMaybe<RequestedWorkObjectsStatusFilter>;
  /** The work object types to filter by (Request, Quote, Job, Invoice, Treatment) */
  types: Array<WorkObject>;
};

/** Attributes for sorting requested work objects */
export type RequestedWorkObjectsSortAttributes = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The key to sort on */
  key: RequestedWorkObjectsSortKey;
};

/** The fields on requested work objects which support sorting functionality */
export type RequestedWorkObjectsSortKey =
  /** Sort by the selected work object's status */
  | 'STATUS';

/** Status filter for requested work objects */
export type RequestedWorkObjectsStatusFilter =
  /** Only active work objects (excludes completed jobs, archived/converted quotes, bad debt/paid invoices, and converted/archived requests). Does not affect treatments. */
  | 'ACTIVE'
  /** All work objects regardless of status */
  | 'ALL';

/** The attributes to sort on a collection of Requests */
export type RequestsSortInput = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The key to sort on */
  key: RequestsSortKey;
};

/** The fields, or associated fields, on a collection of Requests which support sorting functionality */
export type RequestsSortKey =
  /** The field which indicates the first name of the Client */
  | 'FIRST_NAME'
  /** The field which indicates the last name of the Client */
  | 'LAST_NAME'
  /** The field which indicates the primary name of the Client */
  | 'PRIMARY_NAME'
  /** The field which indicates when the Request was made */
  | 'REQUESTED_AT'
  /** The field which indicates the status being sorted by the lifecycle of the Request */
  | 'STATUS'
  /** The field which indicates being sorted first by status and then by date of request descending */
  | 'STATUS_AND_REQUESTED_AT'
  /** The field which indicates the title of the Request */
  | 'TITLE';

/** A Reserved Funds Payout Transaction */
export type ReservedFundsBalanceTransaction = BalanceTransactionInterface & {
  __typename?: 'ReservedFundsBalanceTransaction';
  /** The date the balance transaction was created */
  created: Scalars['ISO8601DateTime']['output'];
  /** The type of currency used */
  currency: Scalars['String']['output'];
  /** The balance transaction fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The balance transaction gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The balance transaction net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The balance transaction type */
  type?: Maybe<BalanceTransaction>;
};

export type ScheduleDetailsInterface = {
  /** End date of the schedule */
  endDate?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Daily end time */
  endTime?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Recurrence details */
  recurrenceSchedule?: Maybe<RecurrenceSchedule>;
  /** Start date of the schedule */
  startDate?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Daily start time */
  startTime?: Maybe<Scalars['ISO8601DateTime']['output']>;
};

/** Attributes for creating a scheduled item */
export type ScheduledItemAttributes = {
  /** The scheduled end time */
  endAt?: InputMaybe<LocalDateTimeAttributes>;
  /** Notify the assigned team */
  notifyTeam?: InputMaybe<Scalars['Boolean']['input']>;
  /** The scheduled start time */
  startAt?: InputMaybe<LocalDateTimeAttributes>;
  /** Ids of the assigned team members */
  teamMemberIdsToAssign?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** Offset in minutes from the time of the task to notify the team */
  teamReminderOffset?: InputMaybe<Scalars['Minutes']['input']>;
};

export type ScheduledItemInterface = {
  /** Indicates whether the scheduled item is for a full day */
  allDay: Scalars['Boolean']['output'];
  /** Users assigned to the scheduled item */
  assignedUsers?: Maybe<UserConnection>;
  /** The user that created this scheduled item */
  createdBy?: Maybe<User>;
  /** Minute duration between start and end time. */
  duration?: Maybe<Scalars['Int']['output']>;
  /** End date and time of the scheduled item. An unscheduled visit is represented by both startAt and endAt being null */
  endAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The ID of the scheduled item */
  id: Scalars['EncodedId']['output'];
  /** Indicates whether the title is the default */
  isDefaultTitle: Scalars['Boolean']['output'];
  /** An override for ordering anytime and unscheduled items */
  overrideOrder?: Maybe<Scalars['Int']['output']>;
  /** The order in which the scheduled item should be routed */
  routingOrder?: Maybe<Scalars['Int']['output']>;
  /** Start date and time of the scheduled item. An unscheduled visit is represented by both startAt and endAt being null */
  startAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Offset in minutes from the time of the scheduled item to notify the team */
  teamReminderOffset?: Maybe<Scalars['Minutes']['output']>;
  /** The title of the scheduled item */
  title?: Maybe<Scalars['String']['output']>;
};


export type ScheduledItemInterfaceAssignedUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** The connection type for ScheduledItemInterface. */
export type ScheduledItemInterfaceConnection = {
  __typename?: 'ScheduledItemInterfaceConnection';
  /** A list of edges. */
  edges?: Maybe<Array<ScheduledItemInterfaceEdge>>;
  /** A list of nodes. */
  nodes: Array<ScheduledItemInterface>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type ScheduledItemInterfaceEdge = {
  __typename?: 'ScheduledItemInterfaceEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: ScheduledItemInterface;
};

export type ScheduledItemStatus =
  /** A scheduled item that is active */
  | 'ACTIVE'
  /** A scheduled item that is completed */
  | 'COMPLETED'
  /** A scheduled item that is overdue */
  | 'OVERDUE'
  /** A scheduled item that is remaining */
  | 'REMAINING';

export type ScheduledItemType =
  /** A scheduled item that is an assessment */
  | 'ASSESSMENT'
  /** A scheduled item that is a basic task */
  | 'BASIC_TASK'
  /** A scheduled item that is an event */
  | 'EVENT'
  /** A scheduled item that is an invoice reminder */
  | 'INVOICE_REMINDER'
  /** A scheduled item that is a quote reminder */
  | 'QUOTE_REMINDER'
  /** A scheduled item that is a visit */
  | 'VISIT';

/** Attributes for filtering scheduled items */
export type ScheduledItemsFilterAttributes = {
  /** Filter appointments assigned to the provided user ids if the user is authorized to view appointments assigned to others */
  assignedTo?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** Include unassigned appointments in the result if the user is authorized to view appointments assigned to others */
  includeUnassigned?: InputMaybe<Scalars['Boolean']['input']>;
  /** Include unscheduled appointments in the result */
  includeUnscheduled?: InputMaybe<Scalars['Boolean']['input']>;
  /** Filter scheduled items that occur within the provided time range. Items with schedules overlapping with the time range are also included. Supports an endDate of up to 1.5 years after the startDate. */
  occursWithin: DateRange;
  /** The type of scheduled item (Basic Tasks, Visits, Events, Assessments, Quote Reminders, and Invoice Reminders) to filter by */
  scheduleItemType?: InputMaybe<ScheduledItemType>;
  /** Controls the scope of returned scheduled items. When omitted, results are limited to items assigned to the authenticated user. Provide values to broaden scope to other users, unassigned items, and/or unscheduled items if the user is authorized to do so. */
  schedulingAspects?: InputMaybe<Array<SchedulingAspect>>;
  /** The status of the scheduled item to filter by */
  status?: InputMaybe<ScheduledItemStatus>;
};

/** The attributes to sort scheduled items. If not provided, the items will be sorted by startAt in ascending order. */
export type ScheduledItemsSortInput = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The field to sort on */
  key: ScheduledItemsSortKey;
};

/** The fields, or associated fields, on a collection of scheduled items which support sorting functionality */
export type ScheduledItemsSortKey =
  /** The completed status of the scheduled item */
  | 'COMPLETED';

export type SchedulingAspect =
  /** Include scheduled and unscheduled items, assigned or unassigned, that the user is authorized to view */
  | 'ALL'
  /** Expand results to include items assigned to any user the user is authorized to view; unassigned items are included as well */
  | 'ASSIGNMENTS'
  /** Expand scope to also return items with no assigned user if the user is authorized to view appointments assigned to others */
  | 'UNASSIGNED'
  /** Restrict results to unassigned items only if the user is authorized to view appointments assigned to others. This restriction takes precedence if combined with other values. */
  | 'UNASSIGNED_ONLY'
  /** Also include unscheduled items */
  | 'UNSCHEDULED';

/** The type of booking to be created */
export type SelfServeBooking =
  /** The online booking will create a job */
  | 'WORK_ORDER'
  /** The online booking will create an assessment */
  | 'WORK_REQUEST';

/** Input for creating a signature */
export type SignatureInput = {
  /** raw base64 encoded string of the signature image */
  rawImage: Scalars['String']['input'];
};

/** Sort directions */
export type SortDirectionEnum =
  /** Sort by ascending order */
  | 'ASCENDING'
  /** Sort by descending order */
  | 'DESCENDING';

export type Source =
  | 'BILLING_INFO'
  | 'CLIENT'
  | 'FLAT_FILE_JOB_IMPORT'
  | 'GOOGLE_CALENDAR_JOB_IMPORT'
  | 'GQL_API'
  | 'HOME'
  | 'IMPORT'
  | 'INTERNAL'
  | 'INVOICE_PREFILL'
  | 'JOB'
  | 'JOBS_INDEX'
  | 'JOB_NEW'
  | 'JOB_PREFILL_MOBILE'
  | 'MODULAR_ONBOARDING_MOBILE'
  | 'ONBOARDING'
  | 'ONLINE_BOOKING'
  | 'PROPERTY'
  | 'QUICK_CREATE'
  | 'QUOTE_CONVERT'
  | 'QUOTE_INDEX_CONVERT'
  | 'QUOTE_PREFILL_MOBILE'
  | 'REACT_SCHEDULE_DAY'
  | 'REACT_SCHEDULE_DAY_INLINE'
  | 'REACT_SCHEDULE_WEEK'
  | 'REACT_SCHEDULE_WEEK_INLINE'
  | 'REQUEST_CONVERT'
  | 'REST_API'
  | 'SCHEDULE_DAY'
  | 'SCHEDULE_DAY_CALENDAR'
  | 'SCHEDULE_LIST'
  | 'SCHEDULE_MAP'
  | 'SCHEDULE_MONTH'
  | 'SCHEDULE_MONTH_CALENDAR'
  | 'SCHEDULE_WEEK'
  | 'SCHEDULE_WEEK_CALENDAR';

/** Source attribution for an object */
export type SourceAttribution = {
  __typename?: 'SourceAttribution';
  /** The lead source value, consistently formatted regardless of the source type */
  displayLeadSource?: Maybe<Scalars['String']['output']>;
  /** Metadata about the source attribution */
  metadata?: Maybe<Scalars['JSON']['output']>;
  /** The source of the object, present if there is an associated object */
  source?: Maybe<SourceAttributionSource>;
  /** The source of the object in plain text, not required if there is an associated object */
  sourceText: Scalars['String']['output'];
};

/** Attributes for updating source attribution. */
export type SourceAttributionAttributes = {
  /** The source of the object in plain text, not required if there is an associated object */
  sourceText?: InputMaybe<Scalars['String']['input']>;
};

/** A union of possible source types for source attribution */
export type SourceAttributionSource = Application | Client | CustomLeadSource | User;

export type StripeCapitalLoan =
  /** Cash advance */
  | 'CASH_ADVANCE'
  /** Fixed term loan */
  | 'FIXED_TERM_LOAN'
  /** Flexible repayment loan */
  | 'FLEX_LOAN';

/** A batch of uploaded supplier invoices */
export type SupplierInvoiceBatch = {
  __typename?: 'SupplierInvoiceBatch';
  /** When the batch was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** Error details if the batch failed */
  errorMessage?: Maybe<Scalars['String']['output']>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** Current processing status of the batch */
  status: SupplierInvoiceBatchStatus;
  /** Documents belonging to this batch */
  supplierInvoiceDocuments: SupplierInvoiceDocumentConnection;
  /** Stable encoded ID for subscribing to asyncTaskStatus updates */
  trackingId: Scalars['String']['output'];
  /** When the batch was last updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
};


/** A batch of uploaded supplier invoices */
export type SupplierInvoiceBatchSupplierInvoiceDocumentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** The connection type for SupplierInvoiceBatch. */
export type SupplierInvoiceBatchConnection = {
  __typename?: 'SupplierInvoiceBatchConnection';
  /** A list of edges. */
  edges?: Maybe<Array<SupplierInvoiceBatchEdge>>;
  /** A list of nodes. */
  nodes: Array<SupplierInvoiceBatch>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type SupplierInvoiceBatchEdge = {
  __typename?: 'SupplierInvoiceBatchEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: SupplierInvoiceBatch;
};

/** Processing status of a supplier invoice batch */
export type SupplierInvoiceBatchStatus =
  /** All invoices processed successfully */
  | 'COMPLETED'
  /** All invoices failed processing */
  | 'FAILED'
  /** Some invoices failed processing */
  | 'PARTIALLY_FAILED'
  /** Batch is being processed */
  | 'PROCESSING'
  /** Batch uploaded, awaiting processing */
  | 'RECEIVED';

/** An individual supplier invoice document extracted from a batch */
export type SupplierInvoiceDocument = {
  __typename?: 'SupplierInvoiceDocument';
  /** When the document was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** Error details if the document failed */
  errorMessage?: Maybe<Scalars['String']['output']>;
  /** Linked expense ID */
  expenseId?: Maybe<Scalars['EncodedId']['output']>;
  /** Invoice date extracted from the PDF */
  extractedDate?: Maybe<Scalars['ISO8601Date']['output']>;
  /** Invoice ID extracted from the PDF */
  extractedInvoiceId?: Maybe<Scalars['String']['output']>;
  /** PO number extracted from the PDF */
  extractedPoNumber?: Maybe<Scalars['String']['output']>;
  /** Subtotal extracted from the PDF */
  extractedSubtotal?: Maybe<Scalars['Float']['output']>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The link to the job in Jobber Online */
  jobDisplayLink?: Maybe<SupplierInvoiceJobDisplayLink>;
  /** Whether the document can be retried */
  retryable: Scalars['Boolean']['output'];
  /** Current processing status */
  status: SupplierInvoiceDocumentStatus;
  /** When the document was last updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
};

/** The connection type for SupplierInvoiceDocument. */
export type SupplierInvoiceDocumentConnection = {
  __typename?: 'SupplierInvoiceDocumentConnection';
  /** A list of edges. */
  edges?: Maybe<Array<SupplierInvoiceDocumentEdge>>;
  /** A list of nodes. */
  nodes: Array<SupplierInvoiceDocument>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type SupplierInvoiceDocumentEdge = {
  __typename?: 'SupplierInvoiceDocumentEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: SupplierInvoiceDocument;
};

/** Autogenerated return type of SupplierInvoiceDocumentRetry. */
export type SupplierInvoiceDocumentRetryPayload = {
  __typename?: 'SupplierInvoiceDocumentRetryPayload';
  /** The supplier invoice document after retry attempt */
  document?: Maybe<SupplierInvoiceDocument>;
  /** Errors encountered during retry */
  userErrors: Array<MutationErrors>;
};

/** Processing status of a supplier invoice document */
export type SupplierInvoiceDocumentStatus =
  /** Expense created successfully */
  | 'COMPLETED'
  /** Extracting invoice data */
  | 'EXTRACTING'
  /** Processing failed */
  | 'FAILED'
  /** Matched to a job */
  | 'MAPPED'
  /** Matching to a job */
  | 'MAPPING'
  /** Awaiting processing */
  | 'PENDING'
  /** No matching job found */
  | 'UNMAPPED';

/** An object with link to a job in Jobber Online and the text display for that link */
export type SupplierInvoiceJobDisplayLink = ReportDisplayLink & {
  __typename?: 'SupplierInvoiceJobDisplayLink';
  /** The text to display for the uri */
  displayText: Scalars['String']['output'];
  /** The URI for the given record in Jobber Online */
  jobberWebUri: Scalars['String']['output'];
};

/** Autogenerated return type of SupplierInvoiceUpload. */
export type SupplierInvoiceUploadPayload = {
  __typename?: 'SupplierInvoiceUploadPayload';
  /** The created supplier invoice batch */
  batch?: Maybe<SupplierInvoiceBatch>;
  /** Errors encountered during upload */
  userErrors: Array<MutationErrors>;
};

/** A tag that a Service Provider can add to a client */
export type Tag = {
  __typename?: 'Tag';
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** A label for tag */
  label: Scalars['String']['output'];
};

/** The connection type for Tag. */
export type TagConnection = {
  __typename?: 'TagConnection';
  /** A list of edges. */
  edges?: Maybe<Array<TagEdge>>;
  /** A list of nodes. */
  nodes: Array<Tag>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type TagEdge = {
  __typename?: 'TagEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Tag;
};

/** A task represents each time a Service Provider has scheduled client meetings, administrative duties, etc. */
export type Task = ScheduledItemInterface & {
  __typename?: 'Task';
  /** Indicates whether the scheduled item is for a full day */
  allDay: Scalars['Boolean']['output'];
  /** Users assigned to the scheduled item */
  assignedUsers?: Maybe<UserConnection>;
  /** The client for the task */
  client?: Maybe<Client>;
  /** The user that created this scheduled item */
  createdBy?: Maybe<User>;
  /** Minute duration between start and end time. */
  duration?: Maybe<Scalars['Int']['output']>;
  /** End date and time of the scheduled item. An unscheduled visit is represented by both startAt and endAt being null */
  endAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The instructions for the task */
  instructions?: Maybe<Scalars['String']['output']>;
  /** Whether the task has been completed */
  isComplete: Scalars['Boolean']['output'];
  /** Indicates whether the title is the default */
  isDefaultTitle: Scalars['Boolean']['output'];
  /** Indicates if the task is part of a recurring chain */
  isRecurring: Scalars['Boolean']['output'];
  /** An override for ordering anytime and unscheduled items */
  overrideOrder?: Maybe<Scalars['Int']['output']>;
  /** The property for the task */
  property?: Maybe<Property>;
  /** Recurrence details */
  recurrenceSchedule?: Maybe<RecurrenceSchedule>;
  /** The order in which the scheduled item should be routed */
  routingOrder?: Maybe<Scalars['Int']['output']>;
  /** Start date and time of the scheduled item. An unscheduled visit is represented by both startAt and endAt being null */
  startAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Offset in minutes from the time of the scheduled item to notify the team */
  teamReminderOffset?: Maybe<Scalars['Minutes']['output']>;
  /** The title of the scheduled item */
  title?: Maybe<Scalars['String']['output']>;
};


/** A task represents each time a Service Provider has scheduled client meetings, administrative duties, etc. */
export type TaskAssignedUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** The connection type for Task. */
export type TaskConnection = {
  __typename?: 'TaskConnection';
  /** A list of edges. */
  edges?: Maybe<Array<TaskEdge>>;
  /** A list of nodes. */
  nodes: Array<Task>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** Input for creating a new task */
export type TaskCreateInput = {
  /** Indicates whether this is an all day task */
  allDay?: InputMaybe<Scalars['Boolean']['input']>;
  /** List of users/employees assigned to the task */
  assignedTo?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** Whether the assigned Users are emailed about this task */
  emailAssignments?: InputMaybe<Scalars['Boolean']['input']>;
  /** When the task ends */
  endAt?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
  /** A note to describe the task */
  instructions?: InputMaybe<Scalars['String']['input']>;
  /** The ICalendarRecurrenceRule that will be used for scheduling tasks */
  recurrenceRule?: InputMaybe<Scalars['ICalendarRule']['input']>;
  /** When the task starts */
  startAt?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
  /** Offset in minutes from the time of the task to notify the team */
  teamReminderOffset?: InputMaybe<Scalars['Minutes']['input']>;
  /** Title of the task */
  title: Scalars['String']['input'];
};

/** Autogenerated return type of TaskCreate. */
export type TaskCreatePayload = {
  __typename?: 'TaskCreatePayload';
  /** The created task */
  task?: Maybe<Task>;
  /** Errors encountered in creating task */
  userErrors: Array<MutationErrors>;
};

/** Autogenerated return type of TaskDelete. */
export type TaskDeletePayload = {
  __typename?: 'TaskDeletePayload';
  /** The tasks that were deleted */
  deletedTasks: Array<Task>;
  /** Errors if there are problems editing the completed */
  userErrors: Array<MutationErrors>;
};

/** An edge in a connection. */
export type TaskEdge = {
  __typename?: 'TaskEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Task;
};

/** Attributes for updating a task */
export type TaskEditInput = {
  /** Indicates whether the task is for a full day */
  allDay?: InputMaybe<Scalars['Boolean']['input']>;
  /** List of users assigned to the task */
  assignedTo?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** The unique identifier of the client to attach to this task */
  clientId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** Whether to edit all future instances of a recurring task, or just the given task */
  editFutureRecurring?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether the assigned Users are emailed about this task */
  emailAssignments?: InputMaybe<Scalars['Boolean']['input']>;
  /** End date and time of the task */
  endAt?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
  /** A note to describe the task */
  instructions?: InputMaybe<Scalars['String']['input']>;
  /** The unique identifier of the property to attach to this task */
  propertyId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The ICalendarRecurrenceRule that will be used for scheduling tasks */
  recurrenceRule?: InputMaybe<Scalars['ICalendarRule']['input']>;
  /** Start date and time of the task */
  startAt?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
  /** Offset in minutes from the time of the task to notify the team */
  teamReminderOffset?: InputMaybe<Scalars['Minutes']['input']>;
  /** The title of the task */
  title?: InputMaybe<Scalars['String']['input']>;
};

/** Autogenerated return type of TaskEdit. */
export type TaskEditPayload = {
  __typename?: 'TaskEditPayload';
  /** The edited task */
  task?: Maybe<Task>;
  /** Errors if there are problems updating the task */
  userErrors: Array<MutationErrors>;
};

/** Filter options for Tasks */
export type TaskFilterAttributes = {
  /** The Encoded ID of the assigned user to filter on. If omitted, tasks assigned to all users will be returned */
  assignedTo?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The completed date filter by */
  completedAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The created date filter by */
  createdAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The end date filter by */
  endAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The IDs of the tasks to filter by */
  ids?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** The start date filter by */
  startAt?: InputMaybe<Iso8601DateTimeRangeInput>;
};

/** The attributes to sort on a collection of tasks */
export type TaskSortInput = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The key to sort on */
  key: TaskSortableFields;
};

/** The fields on a collection of tasks which support sorting functionality */
export type TaskSortableFields =
  /** The field which indicates when the task starts */
  | 'START_AT';

export type TaxCalculationMethodType =
  | 'EXCLUSIVE'
  | 'INCLUSIVE';

/** Input for creating a new tax */
export type TaxCreateInput = {
  /** Make this tax the default for quotes and invoices */
  defaultTax?: InputMaybe<Scalars['Boolean']['input']>;
  /** Tax internal description */
  internalDescription?: InputMaybe<Scalars['String']['input']>;
  /** Tax name */
  name: Scalars['String']['input'];
  /** Tax rate */
  rate: Scalars['Float']['input'];
};

/** Autogenerated return type of TaxCreate. */
export type TaxCreatePayload = {
  __typename?: 'TaxCreatePayload';
  /** The created tax */
  tax?: Maybe<TaxRateBase>;
  /** Errors encountered in creating tax */
  userErrors: Array<MutationErrors>;
};

/** The tax rate and amount details. */
export type TaxDetails = {
  __typename?: 'TaxDetails';
  /** The total tax amount on the invoice or quote. */
  totalTaxAmount: Scalars['Float']['output'];
  /** The total tax rate on the invoice or quote from a tax group or a simple tax rate. */
  totalTaxRate: TaxRateBase;
};

/** Input for creating a new tax group */
export type TaxGroupCreateInput = {
  /** Tax group internal description */
  internalDescription?: InputMaybe<Scalars['String']['input']>;
  /** Tax group name */
  name: Scalars['String']['input'];
  /** Existing tax rates to add to the tax group */
  taxRateIds: Array<Scalars['EncodedId']['input']>;
};

/** Autogenerated return type of TaxGroupCreate. */
export type TaxGroupCreatePayload = {
  __typename?: 'TaxGroupCreatePayload';
  /** The created tax group */
  taxGroup?: Maybe<TaxRate>;
  /** Errors encountered in creating tax group */
  userErrors: Array<MutationErrors>;
};

/** The tax related inputs associated with an invoice */
export type TaxInputType = {
  /** The tax calculation method of the invoice */
  taxCalculationMethod: TaxCalculationMethodType;
  /** The tax id on the invoice */
  taxRateId?: InputMaybe<Scalars['EncodedId']['input']>;
};

/** The tax rate type which may contain other tax rates */
export type TaxRate = {
  __typename?: 'TaxRate';
  /** A list of tax rate's associated with the tax group */
  components?: Maybe<Array<TaxRateBase>>;
  /** Is this tax rate the default? */
  default: Scalars['Boolean']['output'];
  /** The internal description of the tax rate. */
  description?: Maybe<Scalars['String']['output']>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** A string containing the names and rates of component tax rates. */
  label: Scalars['String']['output'];
  /** The name of the tax rate. */
  name: Scalars['String']['output'];
  /** The type of qbo sync. */
  qboTaxType?: Maybe<Scalars['String']['output']>;
  /** The tax %. */
  tax: Scalars['Float']['output'];
};

/** The base type of a simple tax rate */
export type TaxRateBase = {
  __typename?: 'TaxRateBase';
  /** Is this tax rate the default? */
  default: Scalars['Boolean']['output'];
  /** The internal description of the tax rate. */
  description?: Maybe<Scalars['String']['output']>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** A string containing the names and rates of component tax rates. */
  label: Scalars['String']['output'];
  /** The name of the tax rate. */
  name: Scalars['String']['output'];
  /** The type of qbo sync. */
  qboTaxType?: Maybe<Scalars['String']['output']>;
  /** The tax %. */
  tax: Scalars['Float']['output'];
};

/** The connection type for TaxRate. */
export type TaxRateConnection = {
  __typename?: 'TaxRateConnection';
  /** A list of edges. */
  edges?: Maybe<Array<TaxRateEdge>>;
  /** A list of nodes. */
  nodes: Array<TaxRate>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type TaxRateEdge = {
  __typename?: 'TaxRateEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: TaxRate;
};

/** The terminal reader type for terminal payments */
export type TerminalReader =
  /** Card Reader terminal */
  | 'CARD_READER'
  /** Tap to Pay terminal reader */
  | 'TAP_TO_PAY';

/** Attributes for filtering scheduled items */
export type TimeSheetEntriesFilterAttributes = {
  /** Timesheet entries that start after the date, end before the following day or were started on a previous day and were running on the given date */
  activeOnDate?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
  /** ID of the user to whom the time sheet entry belongs to */
  assignedTo?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The timesheet created at date to filter by */
  createdAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** Show timesheet entries for the current user only */
  currentUserOnly?: InputMaybe<Scalars['Boolean']['input']>;
  /** Include time sheet entries that have been approved */
  isApproved?: InputMaybe<Scalars['Boolean']['input']>;
  /** The timesheet start at date to filter by */
  startAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** Include time sheet entries based on whether a timer is running */
  ticking?: InputMaybe<Scalars['Boolean']['input']>;
  /** The timesheet updated at date to filter by */
  updatedAt?: InputMaybe<Iso8601DateTimeRangeInput>;
};

/** The attributes to sort on a client's notes */
export type TimeSheetEntriesSortAttributes = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The field to sort on */
  field: TimeSheetEntriesSortableFieldsEnum;
};

/** The fields on client notes which support sorting functionality */
export type TimeSheetEntriesSortableFieldsEnum =
  /** The field which indicates when the timesheet was started */
  | 'START_AT';

/** Time Sheet Entry */
export type TimeSheetEntry = {
  __typename?: 'TimeSheetEntry';
  /** Indicates whether the time sheet entry is approved. */
  approved: Scalars['Boolean']['output'];
  /** User that approved this time sheet entry. */
  approvedBy?: Maybe<User>;
  /** The client associated with the job linked to the time sheet entry */
  client?: Maybe<Client>;
  /** The time the time sheet was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /**
   * Duration of the time sheet entry in seconds.
   * @deprecated Server should not be calculating duration for running timers. Use finalDuration instead
   */
  duration: Scalars['Seconds']['output'];
  /** Date and time the time sheet entry was completed (resolves to nil for time sheets without a time range). */
  endAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Duration of a stopped time sheet entry (resolves to 0 for ticking entries). */
  finalDuration: Scalars['Seconds']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** Job linked to the timer. */
  job?: Maybe<Job>;
  /** Label on the time sheet entry */
  label?: Maybe<Scalars['String']['output']>;
  /** Labour rate associated with this time sheet entry. */
  labourRate?: Maybe<Scalars['Float']['output']>;
  /** Note attached. */
  note?: Maybe<Scalars['String']['output']>;
  /** User that marked this time sheet entry as paid. */
  paidBy?: Maybe<User>;
  /** Indicates whether the time sheet entry is payable. */
  payable: Scalars['Boolean']['output'];
  /** Date and time the time sheet entry was started. */
  startAt: Scalars['ISO8601DateTime']['output'];
  /** Flag indicating whether the timer is actively running or not. */
  ticking: Scalars['Boolean']['output'];
  /** The category of time associated with this entry */
  timeSheetCategory?: Maybe<TimeSheetEntryConfigurationCategory>;
  /** The last time the time sheet was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** User the time sheet entry belongs to. */
  user?: Maybe<User>;
  /** Visit linked to the time sheet entry. */
  visit?: Maybe<Visit>;
  /** Total duration in seconds the user worked on the related visit. */
  visitDurationTotal: Scalars['Int']['output'];
};

/** Category for a time sheet entry configuration */
export type TimeSheetEntryConfigurationCategory =
  /** An unpaid break entry */
  | 'BREAK'
  /** A paid general timer entry */
  | 'GENERAL';

/** The connection type for TimeSheetEntry. */
export type TimeSheetEntryConnection = {
  __typename?: 'TimeSheetEntryConnection';
  /** A list of edges. */
  edges?: Maybe<Array<TimeSheetEntryEdge>>;
  /** A list of nodes. */
  nodes: Array<TimeSheetEntry>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type TimeSheetEntryEdge = {
  __typename?: 'TimeSheetEntryEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: TimeSheetEntry;
};

/** A grouping of time sheet entries by job or label (no association) */
export type TimeSheetEntryGroup = {
  __typename?: 'TimeSheetEntryGroup';
  /** The job this group is associated with, if group type is JOB */
  byJob?: Maybe<Job>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** Display name for this group (e.g., job name or label) */
  name: Scalars['String']['output'];
  /** Per-day breakdown of time sheet entries for this group */
  timeSheetsByDay: TimeSheetUserDayConnection;
  /** Total duration in seconds for all entries in this group */
  totalDuration: Scalars['Seconds']['output'];
};


/** A grouping of time sheet entries by job or label (no association) */
export type TimeSheetEntryGroupTimeSheetsByDayArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** The connection type for TimeSheetEntryGroup. */
export type TimeSheetEntryGroupConnection = {
  __typename?: 'TimeSheetEntryGroupConnection';
  /** A list of edges. */
  edges?: Maybe<Array<TimeSheetEntryGroupEdge>>;
  /** A list of nodes. */
  nodes: Array<TimeSheetEntryGroup>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type TimeSheetEntryGroupEdge = {
  __typename?: 'TimeSheetEntryGroupEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: TimeSheetEntryGroup;
};

/** Filter attributes for time sheet entry groups */
export type TimeSheetEntryGroupsFilterAttributes = {
  /** Inclusive end date for the time sheet range */
  endDate: Scalars['ISO8601Date']['input'];
  /** Optional list of job IDs to restrict the groups to */
  jobIds?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** Inclusive start date for the time sheet range */
  startDate: Scalars['ISO8601Date']['input'];
  /** The user ID to get entry groups for */
  userId: Scalars['EncodedId']['input'];
};

/** Status related to time sheets or their entries aggregated over a time period */
export type TimeSheetStatus =
  /** Total time on the time sheet is higher than the expected range */
  | 'ABNORMALLY_HIGH'
  /** Total time on the time sheet is within the expected range */
  | 'NORMAL';

/** Time sheet data for a single user on a specific day */
export type TimeSheetUserDay = {
  __typename?: 'TimeSheetUserDay';
  /** The calendar date represented by this day */
  date: Scalars['ISO8601Date']['output'];
  /** The individual time sheet entries for this user on this day */
  entries: TimeSheetEntryConnection;
  /** Status, derived from this day's time sheet entries (e.g., abnormally high) */
  hoursStatus: TimeSheetStatus;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** Total duration in seconds for this user on this day */
  totalDuration: Scalars['Seconds']['output'];
};


/** Time sheet data for a single user on a specific day */
export type TimeSheetUserDayEntriesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** The connection type for TimeSheetUserDay. */
export type TimeSheetUserDayConnection = {
  __typename?: 'TimeSheetUserDayConnection';
  /** A list of edges. */
  edges?: Maybe<Array<TimeSheetUserDayEdge>>;
  /** A list of nodes. */
  nodes: Array<TimeSheetUserDay>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type TimeSheetUserDayEdge = {
  __typename?: 'TimeSheetUserDayEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: TimeSheetUserDay;
};

/** The start date and duration of the job */
export type TimeframeAttributes = {
  /** The unit of duration */
  durationUnits?: InputMaybe<DurationUnit>;
  /** The amount of durationUnits it lasts */
  durationValue?: InputMaybe<Scalars['Int']['input']>;
  /** The starting date */
  startAt?: InputMaybe<Scalars['ISO8601Date']['input']>;
};

/** A Unknown Balance Transaction */
export type UnknownBalanceTransaction = BalanceTransactionInterface & {
  __typename?: 'UnknownBalanceTransaction';
  /** The date the balance transaction was created */
  created: Scalars['ISO8601DateTime']['output'];
  /** The type of currency used */
  currency: Scalars['String']['output'];
  /** The balance transaction fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The balance transaction gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The balance transaction net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The balance transaction type */
  type?: Maybe<BalanceTransaction>;
};

/** Input for updating future visits for a job */
export type UpdateFutureVisitsInput = {
  /** Options for what to copy from the reference visit */
  copyOptions?: InputMaybe<UpdateFutureVisitsOptionsInput>;
  /** The recurrence rule used for dispatching/scheduling new visits. If not provided, existing visit dates are kept. */
  dispatchRecurrenceRule?: InputMaybe<Scalars['ICalendarRule']['input']>;
  /** The ID of the reference visit */
  visitId: Scalars['EncodedId']['input'];
};

/** Options for what to copy from the reference visit when updating future visits */
export type UpdateFutureVisitsOptionsInput = {
  /** Whether to copy assignment from the reference visit */
  assignment?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether to copy quantity overrides from the reference visit */
  override?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether to copy time settings from the reference visit */
  time?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Autogenerated return type of UpdateFutureVisits. */
export type UpdateFutureVisitsPayload = {
  __typename?: 'UpdateFutureVisitsPayload';
  /** Whether the update operation was successfully queued */
  success?: Maybe<Scalars['Boolean']['output']>;
  /** Errors encountered when queueing the update operation */
  userErrors: Array<MutationErrors>;
};

/** A user belongs to an account and generally completes work for clients */
export type User = UserInterface & {
  __typename?: 'User';
  /** The parent account for the user */
  account?: Maybe<Account>;
  /** The address of the user */
  address?: Maybe<UserAddress>;
  /** List of apps user has connected */
  apps: ApplicationConnection;
  /** The color assigned to the user */
  assignedColor?: Maybe<Scalars['String']['output']>;
  /** The vehicle assigned to the user */
  assignedVehicle?: Maybe<Vehicle>;
  /** Whether the user is available for scheduling */
  availableForScheduling: Scalars['Boolean']['output'];
  /** The time the user was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The custom fields set for this object */
  customFields: Array<CustomFieldUnion>;
  /** The email address of the user */
  email: UserEmail;
  /** The first day of the week of the user's account */
  firstDayOfTheWeek: UserFirstDayOfTheWeekEnum;
  /** Returns the last four characters of the franchise access token for the user if one exists */
  franchiseTokenLastFour?: Maybe<Scalars['String']['output']>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** Is the user an administrator on their account */
  isAccountAdmin: Scalars['Boolean']['output'];
  /** Is the user the owner of their account */
  isAccountOwner: Scalars['Boolean']['output'];
  /** Is this the authenticated user querying */
  isCurrentUser: Scalars['Boolean']['output'];
  /** The date the user logged in last */
  lastLoginAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The name of the user */
  name: Name;
  /** The phone of the user */
  phone?: Maybe<UserPhone>;
  /** The status of the user */
  status: UserStatusEnum;
  /** Per-day breakdown of time sheet entries for a user */
  timeSheetsByDay: TimeSheetUserDayConnection;
  /** The timezone of the user's account */
  timezone?: Maybe<Scalars['Timezone']['output']>;
  /** The uuid of the user */
  uuid: Scalars['String']['output'];
};


/** A user belongs to an account and generally completes work for clients */
export type UserAppsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A user belongs to an account and generally completes work for clients */
export type UserTimeSheetsByDayArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  endDate: Scalars['ISO8601Date']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  jobIds?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  last?: InputMaybe<Scalars['Int']['input']>;
  startDate: Scalars['ISO8601Date']['input'];
};

/** The address of a user */
export type UserAddress = AddressInterface & {
  __typename?: 'UserAddress';
  /** The city of the address */
  city?: Maybe<Scalars['String']['output']>;
  /** The point coordinates of the address if it has been geo-coded */
  coordinates?: Maybe<GeoPoint>;
  /** The country of the address */
  country?: Maybe<Scalars['String']['output']>;
  /** The status of geo-locating the coordinates for an address */
  geoStatus?: Maybe<GeoStatus>;
  /** The name of the property for the address */
  name?: Maybe<Scalars['String']['output']>;
  /** The postal code of the address */
  postalCode?: Maybe<Scalars['String']['output']>;
  /** The province of the address */
  province?: Maybe<Scalars['String']['output']>;
  /** The street address */
  street: Scalars['String']['output'];
  /** The first line of the street address */
  street1?: Maybe<Scalars['String']['output']>;
  /** The second line of the street address */
  street2?: Maybe<Scalars['String']['output']>;
};

/** The connection type for User. */
export type UserConnection = {
  __typename?: 'UserConnection';
  /** A list of edges. */
  edges?: Maybe<Array<UserEdge>>;
  /** A list of nodes. */
  nodes: Array<User>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type UserEdge = {
  __typename?: 'UserEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: User;
};

/** Attributes for updating a user */
export type UserEditInput = {
  /** The full name of the user */
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Autogenerated return type of UserEdit. */
export type UserEditPayload = {
  __typename?: 'UserEditPayload';
  /** The modified user */
  user?: Maybe<User>;
  /** Errors encountered when modifying the user */
  userErrors: Array<MutationErrors>;
};

/** The email address of a user */
export type UserEmail = EmailInterface & {
  __typename?: 'UserEmail';
  /** Is the email address valid */
  isValid: Scalars['Boolean']['output'];
  /** The email address as stored (may be standard or what was entered by user) */
  raw: Scalars['String']['output'];
};

/** User errors that are triggered */
export type UserErrorsInterface = {
  /** The message provided for this error. */
  message: Scalars['String']['output'];
  /** The field that triggered the error. */
  path: Array<Scalars['String']['output']>;
};

export type UserFirstDayOfTheWeekEnum =
  /** First day of the week in user's account is on Mondays */
  | 'MONDAY'
  /** First day of the week in user's account is on Sundays (Default) */
  | 'SUNDAY';

/** A user */
export type UserInterface = {
  /** The address of the user */
  address?: Maybe<UserAddress>;
  /** The time the user was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The custom fields set for this object */
  customFields: Array<CustomFieldUnion>;
  /** The email address of the user */
  email: UserEmail;
  /** The first day of the week of the user's account */
  firstDayOfTheWeek: UserFirstDayOfTheWeekEnum;
  /** The unique identifier of the user */
  id: Scalars['EncodedId']['output'];
  /** Is the user an administrator on their account */
  isAccountAdmin: Scalars['Boolean']['output'];
  /** Is the user the owner of their account */
  isAccountOwner: Scalars['Boolean']['output'];
  /** Is this the authenticated user querying */
  isCurrentUser: Scalars['Boolean']['output'];
  /** The date the user logged in last */
  lastLoginAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The name of the user */
  name: Name;
  /** The phone of the user */
  phone?: Maybe<UserPhone>;
  /** The status of the user */
  status: UserStatusEnum;
  /** The timezone of the user's account */
  timezone?: Maybe<Scalars['Timezone']['output']>;
  /** The uuid of the user */
  uuid: Scalars['String']['output'];
};

/** Attributes for filtering by a user's permission levels */
export type UserPermissionFilterAttributes = {
  /** The permission area of Jobber. */
  area?: InputMaybe<PermissionAreaFilterEnum>;
  /** The level of permission granted. */
  level?: InputMaybe<PermissionLevelFilterEnum>;
};

/** The phone number of a user */
export type UserPhone = PhoneNumberInterface & {
  __typename?: 'UserPhone';
  /** The area code of the phone number */
  areaCode?: Maybe<Scalars['String']['output']>;
  /** The country code of the  */
  countryCode?: Maybe<Scalars['String']['output']>;
  /** A user friendly representation of the phone number */
  friendly?: Maybe<Scalars['String']['output']>;
  /** Is the phone number valid */
  isValid: Scalars['Boolean']['output'];
  /** The phone number as stored (may be standard or what was entered by user) */
  raw: Scalars['String']['output'];
};

export type UserStatusEnum =
  /** The user has been activated */
  | 'ACTIVATED'
  /** The user has been deactivated */
  | 'DEACTIVATED'
  /** Has never been invited */
  | 'NOT_INVITED'
  /** An invite has been sent, but not accepted */
  | 'RESEND_INVITE'
  /** An invite has not been sent and can be */
  | 'SEND_INVITE';

/** Filter options for users. */
export type UsersFilterAttributes = {
  /** The permission levels granted for the user for different features */
  permissions?: InputMaybe<UserPermissionFilterAttributes>;
  /** Status to filter on */
  status: UsersStatusFilterEnum;
  /** The user ids to filter by */
  userIds?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
};

/** The attributes to sort on a collection of users */
export type UsersSortInput = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The key to sort on */
  key: UsersSortKey;
};

/** The fields on a collection of users which support sorting functionality */
export type UsersSortKey =
  /** Sort by the user's display name */
  | 'NAME';

export type UsersStatusFilterEnum =
  /** Activated users */
  | 'ACTIVATED'
  /** Deactivated users */
  | 'DEACTIVATED';

/** The number of values per object that belong to a custom field configuration */
export type ValueCount = {
  __typename?: 'ValueCount';
  /** Number of clients with a custom field value for the configuration */
  clients: Scalars['Int']['output'];
  /** Number of invoices with a custom field value for the configuration */
  invoices: Scalars['Int']['output'];
  /** Number of jobs with a custom field value for the configuration */
  jobs: Scalars['Int']['output'];
  /** Number of products and services with a custom field value for the configuration */
  productsAndServices: Scalars['Int']['output'];
  /** Number of properties with a custom field value for the configuration */
  properties: Scalars['Int']['output'];
  /** Number of quotes with a custom field value for the configuration */
  quotes: Scalars['Int']['output'];
  /** Number of users with a custom field value for the configuration */
  users: Scalars['Int']['output'];
};

/** A vehicle */
export type Vehicle = {
  __typename?: 'Vehicle';
  /** The users assigned to the vehicle. */
  assignedUsers: UserConnection;
  /** The timestamp when the vehicle record was created. */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** A URL to an external resource with more information about the vehicle. */
  externalUrl?: Maybe<Scalars['String']['output']>;
  /** The color code representing the vehicle's icon in the user interface. */
  iconColor: Scalars['String']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The vehicle's license plate number. */
  licensePlate?: Maybe<Scalars['String']['output']>;
  /** The live state of the vehicle. */
  liveState?: Maybe<LiveState>;
  /** The manufacturer or brand of the vehicle. */
  make: Scalars['String']['output'];
  /** The specific model designation of the vehicle. */
  model: Scalars['String']['output'];
  /** A user-defined name or identifier for the vehicle. */
  name: Scalars['String']['output'];
  /** The timestamp when the vehicle record was last updated. */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** The Vehicle Identification Number (VIN) of the vehicle. */
  vin?: Maybe<Scalars['String']['output']>;
  /** The production year of the vehicle. */
  year: Scalars['Int']['output'];
};


/** A vehicle */
export type VehicleAssignedUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** The connection type for Vehicle. */
export type VehicleConnection = {
  __typename?: 'VehicleConnection';
  /** A list of edges. */
  edges?: Maybe<Array<VehicleEdge>>;
  /** A list of nodes. */
  nodes: Array<Vehicle>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** Attributes for creating a new vehicle */
export type VehicleCreateInput = {
  /** The external URL to view in App of the vehicle */
  externalUrl?: InputMaybe<Scalars['Url']['input']>;
  /** The color of the vehicle icon */
  iconColor?: InputMaybe<Scalars['Color']['input']>;
  /** The license plate of the vehicle */
  licensePlate?: InputMaybe<Scalars['String']['input']>;
  /** The make of the vehicle */
  make: Scalars['String']['input'];
  /** The model of the vehicle */
  model: Scalars['String']['input'];
  /** The name of the vehicle */
  name: Scalars['String']['input'];
  /** The VIN of the vehicle */
  vin?: InputMaybe<Scalars['String']['input']>;
  /** The year of the vehicle */
  year: Scalars['Int']['input'];
};

/** Autogenerated return type of VehicleCreate. */
export type VehicleCreatePayload = {
  __typename?: 'VehicleCreatePayload';
  /** Errors encountered when creating the vehicle */
  userErrors: Array<MutationErrors>;
  /** The newly created vehicle */
  vehicle?: Maybe<Vehicle>;
};

/** Autogenerated return type of VehicleDelete. */
export type VehicleDeletePayload = {
  __typename?: 'VehicleDeletePayload';
  /** Errors encountered when trying to delete the vehicle */
  userErrors: Array<MutationErrors>;
  /** The deleted vehicle */
  vehicle?: Maybe<Vehicle>;
};

/** An edge in a connection. */
export type VehicleEdge = {
  __typename?: 'VehicleEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Vehicle;
};

/** The status of a vehicle */
export type VehicleStatus =
  /** The vehicle is currently driving */
  | 'DRIVING'
  /** The vehicle is idling */
  | 'IDLE'
  /** The vehicle is turned off */
  | 'OFF'
  /** The status of the vehicle is unavailable */
  | 'STATUS_UNAVAILABLE'
  /** The vehicle is syncing its location */
  | 'SYNCING_LOCATION';

/** Attributes for updating an existing vehicle */
export type VehicleUpdateInput = {
  /** The ids of the users assigned to the vehicle */
  assignedUserIds?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** The external URL to view in App of the vehicle */
  externalUrl?: InputMaybe<Scalars['Url']['input']>;
  /** The color of the vehicle icon */
  iconColor?: InputMaybe<Scalars['Color']['input']>;
  /** The id of the vehicle */
  id: Scalars['EncodedId']['input'];
  /** The license plate of the vehicle */
  licensePlate?: InputMaybe<Scalars['String']['input']>;
  /** The live state of the vehicle */
  liveState?: InputMaybe<LiveStateInput>;
  /** The make of the vehicle */
  make?: InputMaybe<Scalars['String']['input']>;
  /** The model of the vehicle */
  model?: InputMaybe<Scalars['String']['input']>;
  /** The name of the vehicle */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The VIN of the vehicle */
  vin?: InputMaybe<Scalars['String']['input']>;
  /** The year of the vehicle */
  year?: InputMaybe<Scalars['Int']['input']>;
};

/** Autogenerated return type of VehiclesUpdate. */
export type VehiclesUpdatePayload = {
  __typename?: 'VehiclesUpdatePayload';
  /** Errors encountered when updating the vehicle */
  userErrors: Array<MutationErrors>;
  /** The updated vehicle */
  vehicles?: Maybe<Array<Vehicle>>;
};

/** A venmo payment applied to a quote or invoice */
export type VenmoPaymentRecord = PaymentRecordInterface & {
  __typename?: 'VenmoPaymentRecord';
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance (absolute value) */
  amount: Scalars['Float']['output'];
  /** Whether the payment can be edited */
  canEdit: Scalars['Boolean']['output'];
  /** The client associated with the payment */
  client?: Maybe<Client>;
  /** The confirmation number of the Venmo payment */
  confirmationNumber?: Maybe<Scalars['String']['output']>;
  /** Additional details about the payment */
  details?: Maybe<Scalars['String']['output']>;
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The invoice associated with the payment */
  invoice?: Maybe<Invoice>;
  /** Where the payment originated from */
  paymentOrigin?: Maybe<PaymentOrigin>;
  /** The type of payment used, i.e cash, check, Jobber Payments... */
  paymentType?: Maybe<PaymentType>;
  /** The quote associated with the deposit payment */
  quote?: Maybe<Quote>;
  /** The raw amount applied against the quote or invoice balance (preserves sign). */
  rawAmount: Scalars['Float']['output'];
  /** Refunds associated with the payment */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** If sent, the DateTime the payment record was sent to client. */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};


/** A venmo payment applied to a quote or invoice */
export type VenmoPaymentRecordAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A venmo payment applied to a quote or invoice */
export type VenmoPaymentRecordRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** A visit that represents each time a Service Provider goes to a client property to complete work */
export type Visit = ScheduledItemInterface & {
  __typename?: 'Visit';
  /** The actions available after completing the visit */
  actionsUponComplete: Array<VisitActionUponComplete>;
  /** Indicates whether the scheduled item is for a full day */
  allDay: Scalars['Boolean']['output'];
  /** The time window during which the SP can arrive at the visit */
  arrivalWindow?: Maybe<ArrivalWindow>;
  /** Users assigned to the scheduled item */
  assignedUsers?: Maybe<UserConnection>;
  /** The Client for the visit */
  client: Client;
  /** Whether the client has confirmed this visit */
  clientConfirmed: Scalars['Boolean']['output'];
  /** The time that the visit was completed. */
  completedAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The name of the user or system that completed the visit. */
  completedBy?: Maybe<Scalars['String']['output']>;
  /** The time that the visit was created. */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The user that created this scheduled item */
  createdBy?: Maybe<User>;
  /** Minute duration between start and end time. */
  duration?: Maybe<Scalars['Int']['output']>;
  /** End date and time of the scheduled item. An unscheduled visit is represented by both startAt and endAt being null */
  endAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The number of incomplete job form submissions for this visit */
  incompleteJobFormsCount: Scalars['Int']['output'];
  /** The instructions for the visit */
  instructions?: Maybe<Scalars['String']['output']>;
  /** The invoice for the visit */
  invoice?: Maybe<Invoice>;
  /** Whether the visit has been completed */
  isComplete: Scalars['Boolean']['output'];
  /** Indicates whether the title is the default */
  isDefaultTitle: Scalars['Boolean']['output'];
  /** Whether the visit is the last visit for the associated job. */
  isLastScheduledVisit: Scalars['Boolean']['output'];
  /** The Job the visit is associated with */
  job: Job;
  /** A list of line items for the visit */
  lineItems: JobLineItemConnection;
  /** The notes attached to the associated job */
  notes?: Maybe<JobNoteUnionConnection>;
  /** An override for ordering anytime and unscheduled items */
  overrideOrder?: Maybe<Scalars['Int']['output']>;
  /** The property for the visit */
  property: Property;
  /** The order in which the scheduled item should be routed */
  routingOrder?: Maybe<Scalars['Int']['output']>;
  /** Start date and time of the scheduled item. An unscheduled visit is represented by both startAt and endAt being null */
  startAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Offset in minutes from the time of the scheduled item to notify the team */
  teamReminderOffset?: Maybe<Scalars['Minutes']['output']>;
  /**
   * The time of the visit
   * @deprecated Visits don't have a single time, rather a start_at and end_at
   */
  time?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** A list of all timesheet entries for this visit */
  timeSheetEntries?: Maybe<TimeSheetEntryConnection>;
  /** The title of the scheduled item */
  title?: Maybe<Scalars['String']['output']>;
  /** The status of the visit */
  visitStatus: VisitStatusTypeEnum;
};


/** A visit that represents each time a Service Provider goes to a client property to complete work */
export type VisitAssignedUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A visit that represents each time a Service Provider goes to a client property to complete work */
export type VisitLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  quantityFilter?: InputMaybe<VisitLineItemQuantityFilter>;
};


/** A visit that represents each time a Service Provider goes to a client property to complete work */
export type VisitNotesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<NotesSortInput>>;
};


/** A visit that represents each time a Service Provider goes to a client property to complete work */
export type VisitTimeSheetEntriesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A visit that represents each time a Service Provider goes to a client property to complete work */
export type VisitVisitStatusArgs = {
  timezone?: InputMaybe<Scalars['Timezone']['input']>;
};

export type VisitActionUponComplete =
  /** The visit is the last on the job and can be closed */
  | 'CLOSE_JOB'
  /** Close the job and create an invoice later */
  | 'CLOSE_JOB_INVOICE_LATER'
  /** Close the job and create an invoice now */
  | 'CLOSE_JOB_INVOICE_NOW'
  /** The visit can be invoiced later */
  | 'INVOICE_LATER'
  /** The visit can be invoiced immediately */
  | 'INVOICE_NOW'
  /** The visit is the last on the job and can be left open */
  | 'LEAVE_JOB_OPEN';

/** Input for completing a visit */
export type VisitCompleteInput = {
  /** The date and time when the visit was completed. Defaults to current time if not provided. */
  completedAt?: InputMaybe<Scalars['ISO8601DateTime']['input']>;
};

/** Autogenerated return type of VisitComplete. */
export type VisitCompletePayload = {
  __typename?: 'VisitCompletePayload';
  /** Errors if there are problems modifying the visit */
  userErrors: Array<MutationErrors>;
  /** The modified visit */
  visit?: Maybe<Visit>;
};

/** The connection type for Visit. */
export type VisitConnection = {
  __typename?: 'VisitConnection';
  /** A list of edges. */
  edges?: Maybe<Array<VisitEdge>>;
  /** A list of nodes. */
  nodes: Array<Visit>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** Attributes for creating a visit */
export type VisitCreateAttributes = {
  /** The visit instructions */
  instructions?: InputMaybe<Scalars['String']['input']>;
  /** An override for ordering anytime and unscheduled items */
  overrideOrder?: InputMaybe<Scalars['Int']['input']>;
  /** The schedule for the visit */
  schedule?: InputMaybe<ScheduledItemAttributes>;
  /** The visit title */
  title?: InputMaybe<Scalars['String']['input']>;
};

/** Inputs for creating visits for a job */
export type VisitCreateInput = {
  /** The attributes of the visits to create */
  visits: Array<VisitCreateAttributes>;
};

/** Attributes for creating a new line item in visits */
export type VisitCreateLineItemAttributes = {
  /** The category of the line item. Defaults to Service. */
  category?: InputMaybe<ProductsAndServicesCategory>;
  /** The description of the line item */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The name of the line item */
  name: Scalars['String']['input'];
  /** The quantity of the line item */
  quantity: Scalars['Float']['input'];
  /** Save a copy of the new line item to products and services for future use */
  saveToProductsAndServices: Scalars['Boolean']['input'];
  /** Is the line item taxable. Defaults to true. */
  taxable?: InputMaybe<Scalars['Boolean']['input']>;
  /** The total price of the line item */
  totalPrice?: InputMaybe<Scalars['Float']['input']>;
  /** The unit price of the line item */
  unitPrice: Scalars['Float']['input'];
};

/** Input for creating new line items in visits */
export type VisitCreateLineItemInput = {
  /** The line items to create */
  lineItems: Array<VisitCreateLineItemAttributes>;
};

/** Autogenerated return type of VisitCreateLineItems. */
export type VisitCreateLineItemsPayload = {
  __typename?: 'VisitCreateLineItemsPayload';
  /** Errors encountered when modifying the visit line items */
  userErrors: Array<MutationErrors>;
  /** The modified visit */
  visit?: Maybe<Visit>;
};

/** Autogenerated return type of VisitCreate. */
export type VisitCreatePayload = {
  __typename?: 'VisitCreatePayload';
  /** The visits which have been created successfully */
  createdVisits: Array<Visit>;
  /** The job modified when creating visits */
  job: Job;
  /** Errors encountered when modifying the job */
  userErrors: Array<MutationErrors>;
};

/** Input for deleting line items on visits */
export type VisitDeleteLineItemsInput = {
  /** The line items to delete */
  lineItemIds: Array<Scalars['EncodedId']['input']>;
};

/** Autogenerated return type of VisitDeleteLineItems. */
export type VisitDeleteLineItemsPayload = {
  __typename?: 'VisitDeleteLineItemsPayload';
  /** Errors encountered when modifying the visit line items */
  userErrors: Array<MutationErrors>;
  /** The modified visit */
  visit?: Maybe<Visit>;
};

/** Autogenerated return type of VisitDelete. */
export type VisitDeletePayload = {
  __typename?: 'VisitDeletePayload';
  /** Errors encountered when trying to delete the visit */
  userErrors: Array<MutationErrors>;
  /** The deleted visit */
  visits?: Maybe<Array<Visit>>;
};

/** An edge in a connection. */
export type VisitEdge = {
  __typename?: 'VisitEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: Visit;
};

/** Input for updating assigned to an existing visit */
export type VisitEditAssignedUsersInput = {
  /** The ids to the new assigned user for an existing visit */
  assignedUserIds: Array<Scalars['EncodedId']['input']>;
};

/** Autogenerated return type of VisitEditAssignedUsers. */
export type VisitEditAssignedUsersPayload = {
  __typename?: 'VisitEditAssignedUsersPayload';
  /** Errors if there are problems updating the visit. */
  userErrors: Array<MutationErrors>;
  /** The edited visit. */
  visit?: Maybe<Visit>;
};

/** Attributes for updating a visit */
export type VisitEditAttributes = {
  /** The instructions for the visit */
  instructions?: InputMaybe<Scalars['String']['input']>;
  /** The title of the visit */
  title?: InputMaybe<Scalars['String']['input']>;
};

/** Attributes for modifying an existing line item in visits */
export type VisitEditLineItemAttributes = {
  /** The description of the line item */
  description?: InputMaybe<Scalars['String']['input']>;
  /** The unique identifier of the line item */
  lineItemId: Scalars['EncodedId']['input'];
  /** The name of the line item */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The quantity of the line item */
  quantity?: InputMaybe<Scalars['Float']['input']>;
  /** The total price of the line item */
  totalPrice?: InputMaybe<Scalars['Float']['input']>;
  /** The unit price of the line item */
  unitPrice?: InputMaybe<Scalars['Float']['input']>;
};

/** Input for editing new line items in visits */
export type VisitEditLineItemsInput = {
  /** The line items to modify */
  lineItems: Array<VisitEditLineItemAttributes>;
};

/** Autogenerated return type of VisitEditLineItems. */
export type VisitEditLineItemsPayload = {
  __typename?: 'VisitEditLineItemsPayload';
  /** Errors encountered when modifying the visit line items */
  userErrors: Array<MutationErrors>;
  /** The modified visit */
  visit?: Maybe<Visit>;
};

/** Autogenerated return type of VisitEdit. */
export type VisitEditPayload = {
  __typename?: 'VisitEditPayload';
  /** Errors if there are problems updating the visit. */
  userErrors: Array<MutationErrors>;
  /** The edited visit. */
  visit?: Maybe<Visit>;
};

/** Input for updating schedule of an existing visit */
export type VisitEditScheduleInput = {
  /** The new end date of the visit */
  endAt?: InputMaybe<LocalDateTimeAttributes>;
  /** The new start date of the visit */
  startAt?: InputMaybe<LocalDateTimeAttributes>;
};

/** Autogenerated return type of VisitEditSchedule. */
export type VisitEditSchedulePayload = {
  __typename?: 'VisitEditSchedulePayload';
  /** Errors encountered when trying to edit the visit schedule */
  userErrors: Array<MutationErrors>;
  /** The updated visit */
  visit?: Maybe<Visit>;
};

/** Filter options for Visit Statuses */
export type VisitFilterAttributes = {
  /** The Encoded ID of the assigned user to filter on. If omitted, visits assigned to all users will be returned */
  assignedTo?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The completed date filter by */
  completedAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The created date filter by */
  createdAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The end date filter by */
  endAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** The ids of the visit to filter by */
  ids?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** The invoice status filter by */
  invoiceStatus?: InputMaybe<VisitInvoiceStatus>;
  /** Only shows most relevant visits to the billing period for jobs with visit based billing */
  onlyRelevantToBillingPeriod?: InputMaybe<Scalars['Boolean']['input']>;
  /** The line item associated with a specific product or service to filter by */
  productOrServiceId?: InputMaybe<Scalars['EncodedId']['input']>;
  /** The start date filter by */
  startAt?: InputMaybe<Iso8601DateTimeRangeInput>;
  /** Filters by visit status */
  status?: InputMaybe<VisitStatusTypeEnum>;
};

export type VisitInvoiceStatus =
  /** Invoiced only visit */
  | 'INVOICED_ONLY'
  /** Uninvoiced only visit */
  | 'UNINVOICED_ONLY';

/** Filter options for visit line items based on quantity */
export type VisitLineItemQuantityFilter =
  /** Return all line items including those with zero quantity */
  | 'ALL'
  /** Return only line items with non-zero quantity */
  | 'ONLY_NON_ZERO';

/** Visit schedule detailed information */
export type VisitSchedule = ScheduleDetailsInterface & {
  __typename?: 'VisitSchedule';
  /** Users assigned at time of job creation. This may differ from users assigned to the job's visits */
  assignedTo: UserConnection;
  /** End date of the schedule */
  endDate?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Daily end time */
  endTime?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Recurrence details */
  recurrenceSchedule?: Maybe<RecurrenceSchedule>;
  /** Start date of the schedule */
  startDate?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Daily start time */
  startTime?: Maybe<Scalars['ISO8601DateTime']['output']>;
};


/** Visit schedule detailed information */
export type VisitScheduleAssignedToArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type VisitStatusTypeEnum =
  /** A visit is still active */
  | 'ACTIVE'
  /** A visit that has been completed */
  | 'COMPLETED'
  /** An incomplete visit which end time has passed */
  | 'LATE'
  /** An incomplete visit that is scheduled today, which end time has not yet passed */
  | 'TODAY'
  /** A visit that is unscheduled */
  | 'UNSCHEDULED'
  /** An incomplete visit that is upcoming */
  | 'UPCOMING';

/** Autogenerated return type of VisitUncomplete. */
export type VisitUncompletePayload = {
  __typename?: 'VisitUncompletePayload';
  /** Errors if there are problems modifying the visit */
  userErrors: Array<MutationErrors>;
  /** The modified visit */
  visit?: Maybe<Visit>;
};

/** Information about visits on a job */
export type VisitsInfo = {
  __typename?: 'VisitsInfo';
  /** The total of incomplete scheduled and unscheduled visits */
  futureCount: Scalars['Int']['output'];
  /** The total number of incomplete visits */
  incompleteTotal: Scalars['Int']['output'];
  /** Start timestamp of the most recent visit up to the visitsScheduledBetween.before threshold (or current time if not set) for this job */
  mostRecentVisitStartAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The number of past incomplete visits on the job up until the end of the current day */
  pastCount: Scalars['Int']['output'];
  /** The number of scheduled visits that are incomplete */
  scheduledCount: Scalars['Int']['output'];
  /** The number of unscheduled visits */
  unscheduledCount: Scalars['Int']['output'];
};

/** The attributes to sort on a collection of visits */
export type VisitsSortInput = {
  /** The direction of the sort */
  direction: SortDirectionEnum;
  /** The key to sort on */
  key: VisitsSortableFields;
};

/** The fields on a collection of visits which support sorting functionality */
export type VisitsSortableFields =
  /** The field which shows the client last name or company name associated with the visit */
  | 'CLIENT_PRIMARY_NAME'
  /** The field which indicates when the visit was created at */
  | 'CREATED_AT'
  /** The field which indicates when the visit starts */
  | 'START_AT'
  /** The field which shows the visit status priority */
  | 'STATUS';

/** The payload sent to apps which subscribe to a webhook; everything is selected in this type */
export type WebHookPayload = {
  __typename?: 'WebHookPayload';
  /** The unique identifier of the account which triggered the event */
  accountId: Scalars['EncodedId']['output'];
  /** The app id that should receive the web hook event */
  appId: Scalars['String']['output'];
  /** The unique identifier of the object which triggered the event */
  itemId: Scalars['EncodedId']['output'];
  /** The time the event occurred at */
  occuredAt: Scalars['ISO8601DateTime']['output'];
  /** The topic of the web hook event, in the form of `{OBJECT}_{EVENT}` */
  topic: WebHookTopicEnum;
};

export type WebHookTopicEnum =
  /** When an app connect */
  | 'APP_CONNECT'
  /** When an app connect */
  | 'APP_DISCONNECT'
  /** When a client is created */
  | 'CLIENT_CREATE'
  /** When a client is deleted */
  | 'CLIENT_DESTROY'
  /** When a client is updated */
  | 'CLIENT_UPDATE'
  /** When an expense is created */
  | 'EXPENSE_CREATE'
  /** When an expense is deleted */
  | 'EXPENSE_DESTROY'
  /** When an expense is updated */
  | 'EXPENSE_UPDATE'
  /** When an invoice is created */
  | 'INVOICE_CREATE'
  /** When an invoice is deleted */
  | 'INVOICE_DESTROY'
  /** When an invoice is updated */
  | 'INVOICE_UPDATE'
  /** When a job is closed */
  | 'JOB_CLOSED'
  /** When a job is created */
  | 'JOB_CREATE'
  /** When a job is deleted */
  | 'JOB_DESTROY'
  /** When a job is updated */
  | 'JOB_UPDATE'
  /** When a marketing item is updated */
  | 'MARKETING_ITEM_UPDATE'
  /** When a on my way tracking link is requested */
  | 'ON_MY_WAY_TRACKING_LINK_REQUEST'
  /** When a payment is created */
  | 'PAYMENT_CREATE'
  /** When a payment is deleted */
  | 'PAYMENT_DESTROY'
  /** When a payment is updated */
  | 'PAYMENT_UPDATE'
  /** When a payout is created */
  | 'PAYOUT_CREATE'
  /** When a payout is deleted */
  | 'PAYOUT_DESTROY'
  /** When a payout is updated */
  | 'PAYOUT_UPDATE'
  /** When a product or service is created */
  | 'PRODUCT_OR_SERVICE_CREATE'
  /** When a product or service is deleted */
  | 'PRODUCT_OR_SERVICE_DESTROY'
  /** When a product or service is updated */
  | 'PRODUCT_OR_SERVICE_UPDATE'
  /** When a property is created */
  | 'PROPERTY_CREATE'
  /** When a property is deleted */
  | 'PROPERTY_DESTROY'
  /** When a property is updated */
  | 'PROPERTY_UPDATE'
  /** When a quote is approved */
  | 'QUOTE_APPROVED'
  /** When a quote is created */
  | 'QUOTE_CREATE'
  /** When a quote is deleted */
  | 'QUOTE_DESTROY'
  /** When a quote is sent */
  | 'QUOTE_SENT'
  /** When a quote is updated */
  | 'QUOTE_UPDATE'
  /** When a request is created */
  | 'REQUEST_CREATE'
  /** When a request is deleted */
  | 'REQUEST_DESTROY'
  /** When a request is updated */
  | 'REQUEST_UPDATE'
  /** When a timesheet is created */
  | 'TIMESHEET_CREATE'
  /** When a timesheet is deleted */
  | 'TIMESHEET_DESTROY'
  /** When a timesheet is updated */
  | 'TIMESHEET_UPDATE'
  /** When a user is created */
  | 'USER_CREATE'
  /** When a user is updated */
  | 'USER_UPDATE'
  /** When a visit is completed */
  | 'VISIT_COMPLETE'
  /** When a visit is created. When multiple visits are created in a recurring schedule, only the first visit will notify */
  | 'VISIT_CREATE'
  /** When a visit is deleted */
  | 'VISIT_DESTROY'
  /** When a visit is updated */
  | 'VISIT_UPDATE';

export type Webhook =
  /** When an account webhook is present */
  | 'ACCOUNT_WEBHOOK'
  /** When an app webhook is present */
  | 'APP_WEBHOOK';

/** A representation of a webhook endpoint */
export type WebhookEndpoint = {
  __typename?: 'WebhookEndpoint';
  /** The account the webhook endpoint is attached to */
  account: Account;
  /** The app that created the webhook endpoint */
  app: Application;
  /** When the webhook endpoint was created */
  createdAt: Scalars['ISO8601DateTime']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The topic of the webhook endpoint */
  topic: WebHookTopicEnum;
  /** When the webhook endpoint was updated */
  updatedAt: Scalars['ISO8601DateTime']['output'];
  /** URL to be notified at when an event for the topic occurs */
  url: Scalars['String']['output'];
};

/** Input for creating a new webhook endpoint */
export type WebhookEndpointCreateInput = {
  /** The topic of the webhook subscription */
  topic: WebHookTopicEnum;
  /** URL to be notified at when an event for the topic occurs */
  url: Scalars['String']['input'];
};

/** Autogenerated return type of WebhookEndpointCreate. */
export type WebhookEndpointCreatePayload = {
  __typename?: 'WebhookEndpointCreatePayload';
  /** Errors encountered in creating the webhook endpoint */
  userErrors: Array<MutationErrors>;
  /** The created webhook endpoint */
  webhookEndpoint?: Maybe<WebhookEndpoint>;
};

/** Autogenerated return type of WebhookEndpointDelete. */
export type WebhookEndpointDeletePayload = {
  __typename?: 'WebhookEndpointDeletePayload';
  /** The webhook endpoints that have successfully been deleted */
  deletedWebhookEndpoints?: Maybe<Array<WebhookEndpoint>>;
  /** Errors encountered while deleting the webhook endpoints */
  userErrors: Array<MutationErrors>;
};

/** A Won Dispute Balance Transaction */
export type WonDisputeBalanceTransaction = BalanceTransactionInterface & {
  __typename?: 'WonDisputeBalanceTransaction';
  /** The date the balance transaction was created */
  created: Scalars['ISO8601DateTime']['output'];
  /** The type of currency used */
  currency: Scalars['String']['output'];
  /** The balance transaction fee amount in cents */
  feeAmount: Scalars['Int']['output'];
  /** The balance transaction gross amount in cents */
  grossAmount: Scalars['Int']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The balance transaction net amount in cents */
  netAmount: Scalars['Int']['output'];
  /** The balance transaction type */
  type?: Maybe<BalanceTransaction>;
};

/** The collection of attributes that represent a Work Item */
export type WorkItem = {
  __typename?: 'WorkItem';
  /**
   * A Work Item has a default price
   * @deprecated Use ProductOrServiceType instead
   */
  defaultUnitCost: Scalars['Float']['output'];
  /**
   * The description of the Work Item
   * @deprecated Use ProductOrServiceType instead
   */
  description?: Maybe<Scalars['String']['output']>;
  /**
   * The unique id of the Work Item
   * @deprecated Use ProductOrServiceType instead
   */
  id: Scalars['Int']['output'];
  /**
   * A Work Item has a default internal unit cost
   * @deprecated Use ProductOrServiceType instead
   */
  internalUnitCost?: Maybe<Scalars['Float']['output']>;
  /**
   * A Work Item has a default markup
   * @deprecated Use ProductOrServiceType instead
   */
  markup?: Maybe<Scalars['Float']['output']>;
  /**
   * The name of the Work Item
   * @deprecated Use ProductOrServiceType instead
   */
  name: Scalars['String']['output'];
  /**
   * Represents the last quantity this work item had on a quote attached to the same property
   * @deprecated This field is not guaranteed to return a result. Qty is not semantically relevant to this type
   */
  qty?: Maybe<Scalars['String']['output']>;
  /**
   * A Work Item can be taxable or non-taxable
   * @deprecated Use ProductOrServiceType instead
   */
  taxable?: Maybe<Scalars['Boolean']['output']>;
  /**
   * A 'visible' work item will show up as an autocomplete suggestion on quotes/jobs/invoice line items
   * @deprecated Use ProductOrServiceType instead
   */
  visible?: Maybe<Scalars['Boolean']['output']>;
};

export type WorkItemCategoryTypeEnum =
  /** The item is of type Product */
  | 'Product'
  /** The item is of type Service */
  | 'Service';

export type WorkObject =
  /** Represents the Invoice type */
  | 'INVOICE'
  /** Represents the Job type */
  | 'JOB'
  /** Represents the Quote type */
  | 'QUOTE'
  /** Represents the Request type */
  | 'REQUEST'
  /** Represents the Treatment type */
  | 'TREATMENT';

export type WorkObjectSendMessageType =
  /** A booking confirmation notification for an assessment */
  | 'ASSESSMENT_BOOKED'
  /** An assessment reminder */
  | 'ASSESSMENT_REMINDER'
  /** A sent invoice */
  | 'INVOICE_SENT'
  /** A booking confirmation notification */
  | 'JOB_BOOKING_CONFIRMATION'
  /** An onMyWay message */
  | 'ON_MY_WAY'
  /** A sent quote */
  | 'QUOTE_SENT'
  /** A request for card on file */
  | 'REQUEST_CARD_ON_FILE'
  /** A visit reminder */
  | 'VISIT_REMINDER';

/** A union of "work objects," defined as requests, quotes, jobs and invoices. */
export type WorkObjectUnion = Invoice | Job | Quote | Request;

/** The connection type for WorkObjectUnion. */
export type WorkObjectUnionConnection = {
  __typename?: 'WorkObjectUnionConnection';
  /** A list of edges. */
  edges?: Maybe<Array<WorkObjectUnionEdge>>;
  /** A list of nodes. */
  nodes: Array<WorkObjectUnion>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /**
   * The total count of possible records in this list. Supports filters.
   * Please use with caution. Using totalCount raises the likelyhood you will be throttled
   *
   */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type WorkObjectUnionEdge = {
  __typename?: 'WorkObjectUnionEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: WorkObjectUnion;
};

/** Attributes for filtering work objects */
export type WorkObjectsFilterAttributes = {
  /** The encoded ids of the properties to filter by */
  propertyIds?: InputMaybe<Array<Scalars['EncodedId']['input']>>;
  /** The work object types to filter by (Request, Quote, Job, Invoice) */
  types?: InputMaybe<Array<WorkObject>>;
};

/** A zelle payment applied to a quote or invoice */
export type ZellePaymentRecord = PaymentRecordInterface & {
  __typename?: 'ZellePaymentRecord';
  /** Type of income generating payment record */
  adjustmentType: IncomeAdjustmentType;
  /** The allocations associated with the payment */
  allocations?: Maybe<PaymentRecordAllocationInterfaceConnection>;
  /** The amount applied against the quote or invoice balance (absolute value) */
  amount: Scalars['Float']['output'];
  /** Whether the payment can be edited */
  canEdit: Scalars['Boolean']['output'];
  /** The client associated with the payment */
  client?: Maybe<Client>;
  /** The confirmation number of the Zelle payment */
  confirmationNumber?: Maybe<Scalars['String']['output']>;
  /** Additional details about the payment */
  details?: Maybe<Scalars['String']['output']>;
  /** The time the payment record was created */
  entryDate: Scalars['ISO8601DateTime']['output'];
  /** The unique identifier */
  id: Scalars['EncodedId']['output'];
  /** The invoice associated with the payment */
  invoice?: Maybe<Invoice>;
  /** Where the payment originated from */
  paymentOrigin?: Maybe<PaymentOrigin>;
  /** The type of payment used, i.e cash, check, Jobber Payments... */
  paymentType?: Maybe<PaymentType>;
  /** The quote associated with the deposit payment */
  quote?: Maybe<Quote>;
  /** The raw amount applied against the quote or invoice balance (preserves sign). */
  rawAmount: Scalars['Float']['output'];
  /** Refunds associated with the payment */
  refunds?: Maybe<PaymentRecordRefundConnection>;
  /** If sent, the DateTime the payment record was sent to client. */
  sentAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
};


/** A zelle payment applied to a quote or invoice */
export type ZellePaymentRecordAllocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A zelle payment applied to a quote or invoice */
export type ZellePaymentRecordRefundsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};
