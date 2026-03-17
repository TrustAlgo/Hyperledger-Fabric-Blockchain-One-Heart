/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Campaign } from './campaign';

@Info({ title: 'CampaignContract', description: 'OneHeart Project' })
export class CampaignContract extends Contract {

    // =========================================================
    // Check existence
    // =========================================================
    @Transaction(false)
    @Returns('boolean')
    public async campaignExists(ctx: Context, campaignId: string): Promise<boolean> {
        const data = await ctx.stub.getState(campaignId);
        return !!data && data.length > 0;
    }

    // =========================================================
    // CREATE CAMPAIGN
    // =========================================================
    @Transaction()
    public async createCampaign(
        ctx: Context,
        campaignId: string,
        requestor: string,
        patientInv: string,
        campaignStory: string,
        requestAmount: number
    ): Promise<void> {

        // Validate inputs
        if (requestAmount <= 0) {
            throw new Error('Request amount must be greater than zero');
        }

        // Prevent duplicate campaignId
        if (await this.campaignExists(ctx, campaignId)) {
            throw new Error(`Campaign ${campaignId} already exists`);
        }

        // Prevent duplicate invoice (using composite key)
        const invoiceKey = ctx.stub.createCompositeKey('invoice', [patientInv]);
        const invoiceExists = await ctx.stub.getState(invoiceKey);
        if (invoiceExists && invoiceExists.length > 0) {
            throw new Error(`Invoice ${patientInv} already used`);
        }

        // Create campaign object
        const campaign: Campaign = new Campaign({
            campaignRef: Date.now(),        // Deterministic unique ID
            requestor,
            requestAmount,                  // fullAmount
            patientInvoice: patientInv,
            campaignStory,
            donatedAmount: 0
        });

        // Save campaign
        await ctx.stub.putState(
            campaignId,
            Buffer.from(JSON.stringify(campaign))
        );

        // Store invoice reference
        await ctx.stub.putState(invoiceKey, Buffer.from(campaignId));

        console.info(`Campaign created with reference ID: ${campaign.campaignRef}`);
    }

    // =========================================================
    // READ CAMPAIGN
    // =========================================================
    @Transaction(false)
    @Returns('Campaign')
    public async readCampaign(ctx: Context, campaignId: string): Promise<Campaign> {

        if (!(await this.campaignExists(ctx, campaignId))) {
            throw new Error(`Campaign ${campaignId} does not exist`);
        }

        const data = await ctx.stub.getState(campaignId);
        return JSON.parse(data.toString()) as Campaign;
    }

    // =========================================================
    // MAKE DONATION (updateCampaign)
    // =========================================================
    @Transaction()
    public async makeDonation(
        ctx: Context,
        campaignId: string,
        newDonationAmount: number
    ): Promise<void> {

        if (newDonationAmount <= 0) {
            throw new Error('Donation amount must be positive');
        }

        if (!(await this.campaignExists(ctx, campaignId))) {
            throw new Error(`Campaign ${campaignId} does not exist`);
        }

        const data = await ctx.stub.getState(campaignId);
        const campaign: Campaign = JSON.parse(data.toString());

        const updatedAmount = campaign.donatedAmount + newDonationAmount;

        // Prevent over-funding beyond requested amount
        if (updatedAmount > campaign.requestAmount) {
            throw new Error('Donation exceeds requested amount');
        }

        campaign.donatedAmount = updatedAmount;

        await ctx.stub.putState(
            campaignId,
            Buffer.from(JSON.stringify(campaign))
        );
    }

    // =========================================================
    // DELETE CAMPAIGN
    // =========================================================
    @Transaction()
    public async deleteCampaign(ctx: Context, campaignId: string): Promise<void> {

        if (!(await this.campaignExists(ctx, campaignId))) {
            throw new Error(`Campaign ${campaignId} does not exist`);
        }

        await ctx.stub.deleteState(campaignId);
    }
}
