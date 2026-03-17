/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context } from 'fabric-contract-api';
import { ChaincodeStub, ClientIdentity } from 'fabric-shim';
import { CampaignContract } from '.';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import winston = require('winston');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

// =========================================================
// Mock Context
// =========================================================
class TestContext implements Context {

    public stub: sinon.SinonStubbedInstance<ChaincodeStub> =
        sinon.createStubInstance(ChaincodeStub);

    public clientIdentity: sinon.SinonStubbedInstance<ClientIdentity> =
        sinon.createStubInstance(ClientIdentity);

    public logger = {
        getLogger: sinon.stub().returns(
            sinon.createStubInstance(winston.createLogger().constructor)
        ),
        setLevel: sinon.stub(),
    };
}

// =========================================================
// Test Suite
// =========================================================
describe('CampaignContract', () => {

    let contract: CampaignContract;
    let ctx: TestContext;

    const existingCampaign = {
        campaignRef: 999,
        requestor: 'John',
        requestAmount: 1000,
        patientInvoice: 'INV-1',
        campaignStory: 'Help needed',
        donatedAmount: 200
    };

    beforeEach(() => {
        contract = new CampaignContract();
        ctx = new TestContext();

        // Existing campaigns
        ctx.stub.getState.withArgs('1001')
            .resolves(Buffer.from(JSON.stringify(existingCampaign)));

        ctx.stub.getState.withArgs('1002')
            .resolves(Buffer.from(JSON.stringify(existingCampaign)));

        // Non-existing
        ctx.stub.getState.withArgs('1003')
            .resolves(Buffer.from(''));
    });

    // =====================================================
    // campaignExists
    // =====================================================
    describe('#campaignExists', () => {

        it('should return true for existing campaign', async () => {
            await contract.campaignExists(ctx, '1001')
                .should.eventually.be.true;
        });

        it('should return false for non-existing campaign', async () => {
            await contract.campaignExists(ctx, '1003')
                .should.eventually.be.false;
        });

    });

    // =====================================================
    // CREATE CAMPAIGN
    // =====================================================
    describe('#Create Campaign', () => {

        it('should create a new campaign', async () => {

            await contract.createCampaign(
                ctx,
                '1003',
                'Alice',
                'INV-NEW',
                'Medical emergency',
                5000
            );

            ctx.stub.putState.should.have.been.calledOnce;
        });

        it('should throw error if campaign exists', async () => {

            await contract.createCampaign(
                ctx,
                '1001',
                'Alice',
                'INV-NEW',
                'Medical emergency',
                5000
            ).should.be.rejectedWith(/already exists/);

        });

    });

    // =====================================================
    // READ CAMPAIGN
    // =====================================================
    describe('#Read Campaign', () => {

        it('should return a campaign', async () => {

            const result = await contract.readCampaign(ctx, '1001');

            result.should.deep.equal(existingCampaign);

        });

        it('should throw error if campaign not found', async () => {

            await contract.readCampaign(ctx, '1003')
                .should.be.rejectedWith(/does not exist/);

        });

    });

    // =====================================================
    // MAKE DONATION
    // =====================================================
    describe('#Donate to Campaign', () => {

        it('should update donation amount', async () => {

            await contract.makeDonation(ctx, '1001', 300);

            ctx.stub.putState.should.have.been.calledOnce;

            const updatedBuffer =
                ctx.stub.putState.firstCall.args[1];

            const updatedCampaign =
                JSON.parse(updatedBuffer.toString());

            updatedCampaign.donatedAmount.should.equal(500);
        });

        it('should throw error if campaign not found', async () => {

            await contract.makeDonation(ctx, '1003', 300)
                .should.be.rejectedWith(/does not exist/);

        });

    });

    // =====================================================
    // DELETE CAMPAIGN
    // =====================================================
    describe('#Delete Campaign', () => {

        it('should delete campaign', async () => {

            await contract.deleteCampaign(ctx, '1001');

            ctx.stub.deleteState
                .should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw error if campaign not found', async () => {

            await contract.deleteCampaign(ctx, '1003')
                .should.be.rejectedWith(/does not exist/);

        });

    });

});
