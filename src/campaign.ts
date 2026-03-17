/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object as ContractObject, Property } from 'fabric-contract-api';

/**
 * Campaign Asset
 * Represents a fundraising campaign stored on the ledger
 */
@ContractObject()
export class Campaign {

    /**
     * Unique campaign reference ID (auto-generated)
     */
    @Property()
    public campaignRef: number = 0;

    /**
     * Name of the requestor (patient or organizer)
     */
    @Property()
    public requestor: string = '';

    /**
     * Requested amount to be raised
     */
    @Property()
    public requestAmount: number = 0;

    /**
     * Patient invoice from hospital (authentication proof)
     */
    @Property()
    public patientInvoice: string = '';

    /**
     * Story or plea statement for the campaign
     */
    @Property()
    public campaignStory: string = '';

    /**
     * Total donations received so far
     */
    @Property()
    public donatedAmount: number = 0;

    /**
     * Constructor (optional initialization)
     */
    constructor(init?: Partial<Campaign>) {
        Object.assign(this, init);
    }
}
