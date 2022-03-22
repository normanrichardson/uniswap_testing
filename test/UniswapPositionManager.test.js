const { expect } = require('chai');
const { ethers, network } = require('hardhat');

require('dotenv').config();

// Start test block
describe('UniswapLiquidityManager', function () {
    let 
        evmStateA, 
        evmStateB,
        signr2, 
        signr3, 
        factory, 
        posMang,
        swapperWbtc,
        swapperUsdc,
        swapperWbtcUsdc,
        swapperUsdcWbtc,
        pmUsdcWbtc,
        weth,
        usdc,
        wbtc,
        tokenId,
        tickPrice,
        tickSpacing,
        poolTickMax,
        poolTickMin,
        wbtcLiqTest,
        usdcLiqTest;

    const 
        wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        wbtcAddress  = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

    before( async () => {
        const routerAddress  = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
        const posMangAddress = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
        const factoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
        
        factory = await ethers.getContractAt('IUniswapV3Factory', factoryAddress);
        posMang = await ethers.getContractAt('INonfungiblePositionManager', posMangAddress);
        const router = await ethers.getContractAt('ISwapRouter', routerAddress);
        const Swapper = await ethers.getContractFactory('Swapper');
        const Liquidity = await ethers.getContractFactory('LiquidityExamples');

        swapperWbtc = await Swapper.deploy(router.address, wethAddress, wbtcAddress, 3000);
        swapperUsdc = await Swapper.deploy(router.address, wethAddress, usdcAddress, 3000);
        swapperWbtcUsdc = await Swapper.deploy(router.address, wbtcAddress, usdcAddress, 3000);
        swapperUsdcWbtc = await Swapper.deploy(router.address, usdcAddress, wbtcAddress, 3000);
        
        pmUsdcWbtc = await Liquidity.deploy(posMang.address, wbtcAddress, usdcAddress, 3000);
        
        weth = await ethers.getContractAt('DepositableERC20', wethAddress);
        wbtc = await ethers.getContractAt('IERC20Extended', wbtcAddress);
        usdc = await ethers.getContractAt('IERC20Extended', usdcAddress);

        // Get signers for testing
        [ , signr2, signr3] = await ethers.getSigners();
    });
    
    it('The pools exist', async () => {
        const poolWbtcUsdc = await factory.getPool(wbtcAddress, usdcAddress, 3000);
        const poolWbtc = await factory.getPool(wbtcAddress, wethAddress, 3000);
        const poolUsdc = await factory.getPool(wethAddress, usdcAddress, 3000);
        
        // Returns the 0x address if the pool does not exist
        expect(poolWbtcUsdc).to.not.be.properHex(0).to.not.hexEqual('0x');
        expect(poolWbtc).to.not.be.properHex(0).to.not.hexEqual('0x');
        expect(poolUsdc).to.not.be.properHex(0).to.not.hexEqual('0x');

        // Get the pools parameters
        const pool = await ethers.getContractAt('IUniswapV3Pool', poolWbtcUsdc);
        
        [, tickPrice] = await pool.slot0();
        tickSpacing = await pool.tickSpacing();
        //See MAX_TICK https://github.com/Uniswap/v3-core/blob/main/contracts/libraries/TickMath.sol
        poolTickMax = Math.floor(887272/tickSpacing)*tickSpacing;
        poolTickMin = -poolTickMax;
    });

    it('Get the underlying assets', async () => {
        const signr = signr3;
        const ethTransfer = ethers.BigNumber.from('1');
        const weiTransfer = ethers.constants.WeiPerEther.mul(ethTransfer);
        
        // Get Wbtc
        await expect(() => weth.connect(signr).deposit({value: weiTransfer}))
            .to.changeEtherBalance(signr, weiTransfer.mul(-1));
        
        const wbtcBefore = await wbtc.connect(signr).balanceOf(signr.address);

        await weth.connect(signr).approve(swapperWbtc.address, weiTransfer);
        await expect( () => swapperWbtc.connect(signr).swapExactInputSingle(weiTransfer))
            .to.changeTokenBalance(weth, signr, weiTransfer.mul(-1));
        
        const wbtcAfter = await wbtc.balanceOf(signr.address);
        
        wbtcLiqTest = wbtcAfter.sub(wbtcBefore);
        expect(wbtcLiqTest).to.gt(0);
        
        // Get USDC
        await expect(() => weth.connect(signr).deposit({value: weiTransfer}))
            .to.changeEtherBalance(signr, weiTransfer.mul(-1));
               
        const usdcBefore = await usdc.balanceOf(signr.address);

        await weth.connect(signr).approve(swapperUsdc.address, weiTransfer);
        await expect( () => swapperUsdc.connect(signr).swapExactInputSingle(weiTransfer))
            .to.changeTokenBalance(weth, signr, weiTransfer.mul(-1));

        const usdcAfter = await usdc.balanceOf(signr.address);
        
        usdcLiqTest = usdcAfter.sub(usdcBefore);
        expect(usdcLiqTest).to.gt(0);

        evmStateB = await  network.provider.send('evm_snapshot');
    });

    it('Takes a liquidity position over the entire domain', async () => {
        const signr = signr3;
        
        await wbtc.connect(signr).approve(pmUsdcWbtc.address, wbtcLiqTest);
        await usdc.connect(signr).approve(pmUsdcWbtc.address, usdcLiqTest);

        const tx = await pmUsdcWbtc.connect(signr).mintNewPosition(wbtcLiqTest, usdcLiqTest, poolTickMin, poolTickMax);
        
        // Get the NFT token id
        const rc = await tx.wait();
        const event = rc.events.find(event => event.event === 'IncLiquidity');

        let liquidity, amount0, amount1;

        [tokenId, liquidity, amount0, amount1] = event.args;

        expect(liquidity).to.gt(0);
        expect(amount0).to.gt(0);
        expect(amount1).to.gt(0);
        
        //Take a snapshot of the evm states for testing later
        evmStateA = await  network.provider.send('evm_snapshot');
    });

    it('Simulate trading', async () => {
        const signr = signr2;
        const ethTransfer = ethers.BigNumber.from('5000');
        const weiTransfer = ethers.constants.WeiPerEther.mul(ethTransfer);
        
        // Get Wbtc
        await weth.connect(signr).deposit({value: weiTransfer});

        let before = await wbtc.connect(signr).balanceOf(signr.address);

        await weth.connect(signr).approve(swapperWbtc.address, weiTransfer);
        await swapperWbtc.connect(signr).swapExactInputSingle(weiTransfer);

        let after = await wbtc.balanceOf(signr.address);
        let delta = after.sub(before);
        
        for (let i=0; i<4; i++) {
            let delta_i = delta;

            //1st trade forward:
            before = await usdc.connect(signr).balanceOf(signr.address);
            await wbtc.connect(signr).approve(swapperWbtcUsdc.address, delta);
            await swapperWbtcUsdc.connect(signr).swapExactInputSingle(delta);
            after = await usdc.connect(signr).balanceOf(signr.address);
            delta = after.sub(before);

            //2nd trade back:
            before = await wbtc.connect(signr).balanceOf(signr.address);
            await usdc.connect(signr).approve(swapperUsdcWbtc.address, delta);
            await swapperUsdcWbtc.connect(signr).swapExactInputSingle(delta);
            after =  await wbtc.connect(signr).balanceOf(signr.address);
            delta = after.sub(before);

            expect(delta_i.sub(delta)).to.gt(0);
        }
    });
        
    it('Recover pool fees', async () => {
        const signr = signr3;

        await expect(pmUsdcWbtc.connect(signr).collectAllFees(tokenId))
            .to.emit(posMang, 'Collect')
            .to.emit(wbtc, 'Transfer')
            .to.emit(usdc, 'Transfer');
    });

    describe('Change liquidity and NFT owner', ()=>{
        beforeEach( async () => {
            await network.provider.send('evm_revert', [evmStateA]);
            evmStateA = await network.provider.send('evm_snapshot');
        });

        it('Increase liquidity', async () => {
            const signr = signr3;
            const ethTransfer = ethers.BigNumber.from('2');
            const weiTransfer = ethers.constants.WeiPerEther.mul(ethTransfer).div(10);

            // Get Wbtc
            await weth.connect(signr).deposit({value: weiTransfer});
            await weth.connect(signr).approve(swapperWbtc.address, weiTransfer);
            const wbtcBefore = await wbtc.connect(signr).balanceOf(signr.address);

            await swapperWbtc.connect(signr).swapExactInputSingle(weiTransfer);
            const wbtcAfter = await wbtc.connect(signr).balanceOf(signr.address);
            const wbtcLiq = wbtcAfter.sub(wbtcBefore);

            // Get USDC
            await weth.connect(signr).deposit({value: weiTransfer});
            await weth.connect(signr).approve(swapperUsdc.address, weiTransfer);
            const usdcBefore = await usdc.connect(signr).balanceOf(signr.address);

            await swapperUsdc.connect(signr).swapExactInputSingle(weiTransfer);
            const usdcAfter = await usdc.connect(signr).balanceOf(signr.address);
            const usdcLiq = usdcAfter.sub(usdcBefore);

            // Increase liquidity
            await wbtc.connect(signr).approve(pmUsdcWbtc.address, wbtcLiq);
            await usdc.connect(signr).approve(pmUsdcWbtc.address, usdcLiq);

            await expect( pmUsdcWbtc.connect(signr).increaseLiquidityCurrentRange(tokenId, wbtcLiq, usdcLiq))
                .to.emit(posMang, 'IncreaseLiquidity')
                .to.emit(wbtc, 'Transfer')
                .to.emit(usdc, 'Transfer');
        });
    
        it('Decrease liquidity', async () => {
            const signr = signr3;
            const percent = 50;

            // Decrease liquidity
            await expect(pmUsdcWbtc.connect(signr).decreaseLiquidity(tokenId, percent))
                .to.emit(posMang, 'Collect')
                .to.emit(wbtc, 'Transfer')
                .to.emit(usdc, 'Transfer')
                .to.emit(posMang, 'DecreaseLiquidity');
        });
    
        it('Transfer the NFT position to the owner', async () => {
            const signr = signr3;
            
            // Transfer the position
            await expect(pmUsdcWbtc.connect(signr).retrieveNFT(tokenId))
                .to.emit(posMang,'Transfer')
                .withArgs(pmUsdcWbtc.address, signr.address, tokenId);
        });
    }); 

    describe('Additional liquidity positions', () => {
        
        beforeEach( async () => {
            await network.provider.send('evm_revert', [evmStateB]);
            evmStateB = await network.provider.send('evm_snapshot');
        });
        
        it('Take a position one tick spacing wide and below the current tick', async () => {
            const signr = signr3;

            await usdc.connect(signr).approve(pmUsdcWbtc.address, usdcLiqTest);
            
            const tick_u = Math.floor(tickPrice/tickSpacing) * tickSpacing;
            const tick_l = tick_u - tickSpacing;

            const tx = await pmUsdcWbtc.connect(signr).mintNewPosition(0, usdcLiqTest, tick_l, tick_u);
            // Get the NFT token id
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'IncLiquidity');

            let liquidity, amount0, amount1;

            [tokenId, liquidity, amount0, amount1] = event.args;

            expect(liquidity).to.gt(0);
            expect(amount0).to.eq(0);
            expect(amount1).to.eq(usdcLiqTest);
        });

        it('Take a position one tick spacing wide and above the current tick', async () => {
            const signr = signr3;

            await wbtc.connect(signr).approve(pmUsdcWbtc.address, wbtcLiqTest);
            
            const tick_l = Math.floor(tickPrice/tickSpacing) * tickSpacing + tickSpacing;
            const tick_u = tick_l + tickSpacing;

            const tx = await pmUsdcWbtc.connect(signr).mintNewPosition(wbtcLiqTest, 0, tick_l, tick_u);
            // Get the NFT token id
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'IncLiquidity');

            let liquidity, amount0, amount1;

            [tokenId, liquidity, amount0, amount1] = event.args;

            expect(liquidity).to.gt(0);
            expect(amount0).to.eq(wbtcLiqTest);
            expect(amount1).to.eq(0);
        });

        it('Take a position one tick spacing wide and around the current tick', async () => {
            const signr = signr3;

            await wbtc.connect(signr).approve(pmUsdcWbtc.address, wbtcLiqTest);
            await usdc.connect(signr).approve(pmUsdcWbtc.address, usdcLiqTest);
            
            const tick_l = Math.floor(tickPrice/tickSpacing) * tickSpacing;
            const tick_u = tick_l + tickSpacing;

            const tx = await pmUsdcWbtc.connect(signr).mintNewPosition(wbtcLiqTest, usdcLiqTest, tick_l, tick_u);
            // Get the NFT token id
            const rc = await tx.wait();
            const event = rc.events.find(event => event.event === 'IncLiquidity');

            let liquidity, amount0, amount1;

            [tokenId, liquidity, amount0, amount1] = event.args;

            expect(liquidity).to.gt(0);
            expect(amount0).to.gt(0);
            expect(amount1).to.gt(0);
        });
    });
});
