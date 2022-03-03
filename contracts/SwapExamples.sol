// contracts/SwapExample.sol
// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;
pragma abicoder v2;

import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';

contract SwapExample{
    address public constant Tk1 = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public constant Tk2 = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    uint24 public constant poolFee = 3000;
    ISwapRouter public immutable router;

    constructor(ISwapRouter _router) {
        router = _router;
    }

    function swapExactInputSingle (uint256 ammount) public {
        
        address recipient = msg.sender;
        TransferHelper.safeTransferFrom(Tk1, recipient, address(this), ammount);
        TransferHelper.safeApprove(Tk1, address(router), ammount);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({        
            tokenIn: Tk1,
            tokenOut: Tk2,
            fee: poolFee,
            recipient: recipient,
            deadline: block.timestamp,
            amountIn: ammount,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = router.exactInputSingle(params);
    }

    function swapExactOutputSingle (uint256 amountOut, uint256 ammountMax) public {
        address recipient = msg.sender;
        TransferHelper.safeTransferFrom(Tk1, recipient, address(this), ammountMax);
        TransferHelper.safeApprove(Tk1, address(router), ammountMax);

        ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter.ExactOutputSingleParams({        
            tokenIn: Tk1,
            tokenOut: Tk2,
            fee: poolFee,
            recipient: recipient,
            deadline: block.timestamp,
            amountOut: amountOut,
            amountInMaximum: ammountMax,
            sqrtPriceLimitX96: 0
        });

        uint256 actAmountOut = router.exactOutputSingle(params);
        
        if (actAmountOut<amountOut) {
            // Reduce the residuce in the approval to zero
            TransferHelper.safeApprove(Tk1, address(router), 0);
            TransferHelper.safeTransfer(Tk1, recipient,amountOut-actAmountOut);
        }
    }
}
