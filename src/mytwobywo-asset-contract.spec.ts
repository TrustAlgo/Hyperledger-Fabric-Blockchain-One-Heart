/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context } from 'fabric-contract-api';
import { ChaincodeStub, ClientIdentity } from 'fabric-shim';
import { MytwobywoAssetContract } from '.';

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
describe('MytwobywoAssetContract', () => {

    let contract: MytwobywoAssetContract;
    let ctx: TestContext;

    beforeEach(() => {

        contract = new MytwobywoAssetContract();
        ctx = new TestContext();

        // Existing assets
        ctx.stub.getState.withArgs('1001')
            .resolves(Buffer.from('{"value":"mytwobywo asset 1001 value"}'));

        ctx.stub.getState.withArgs('1002')
            .resolves(Buffer.from('{"value":"mytwobywo asset 1002 value"}'));

        // Non-existing asset
        ctx.stub.getState.withArgs('1003')
            .resolves(Buffer.from(''));
    });

    // =====================================================
    // EXISTS
    // =====================================================
    describe('#mytwobywoAssetExists', () => {

        it('should return true for existing asset', async () => {
            await contract.mytwobywoAssetExists(ctx, '1001')
                .should.eventually.be.true;
        });

        it('should return false for non-existing asset', async () => {
            await contract.mytwobywoAssetExists(ctx, '1003')
                .should.eventually.be.false;
        });

    });

    // =====================================================
    // CREATE
    // =====================================================
    describe('#createMytwobywoAsset', () => {

        it('should create a new asset', async () => {

            await contract.createMytwobywoAsset(
                ctx,
                '1003',
                'mytwobywo asset 1003 value'
            );

            ctx.stub.putState.should.have.been.calledOnceWithExactly(
                '1003',
                Buffer.from('{"value":"mytwobywo asset 1003 value"}')
            );
        });

        it('should throw error if asset exists', async () => {

            await contract.createMytwobywoAsset(
                ctx,
                '1001',
                'myvalue'
            ).should.be.rejectedWith(/already exists/);

        });

    });

    // =====================================================
    // READ
    // =====================================================
    describe('#readMytwobywoAsset', () => {

        it('should return an asset', async () => {

            const result =
                await contract.readMytwobywoAsset(ctx, '1001');

            result.should.deep.equal({
                value: 'mytwobywo asset 1001 value'
            });

        });

        it('should throw error if asset not found', async () => {

            await contract.readMytwobywoAsset(ctx, '1003')
                .should.be.rejectedWith(/does not exist/);

        });

    });

    // =====================================================
    // UPDATE
    // =====================================================
    describe('#updateMytwobywoAsset', () => {

        it('should update an asset', async () => {

            await contract.updateMytwobywoAsset(
                ctx,
                '1001',
                'mytwobywo asset 1001 new value'
            );

            ctx.stub.putState.should.have.been.calledOnceWithExactly(
                '1001',
                Buffer.from('{"value":"mytwobywo asset 1001 new value"}')
            );
        });

        it('should throw error if asset not found', async () => {

            await contract.updateMytwobywoAsset(
                ctx,
                '1003',
                'new value'
            ).should.be.rejectedWith(/does not exist/);

        });

    });

    // =====================================================
    // DELETE
    // =====================================================
    describe('#deleteMytwobywoAsset', () => {

        it('should delete an asset', async () => {

            await contract.deleteMytwobywoAsset(ctx, '1001');

            ctx.stub.deleteState
                .should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw error if asset not found', async () => {

            await contract.deleteMytwobywoAsset(ctx, '1003')
                .should.be.rejectedWith(/does not exist/);

        });

    });

});
