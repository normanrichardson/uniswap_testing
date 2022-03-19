// contracts/SwapExample.sol
// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;
pragma abicoder v2;

import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';

contract Swapper{
    address private tk1;
    address private tk2;
    uint24 private poolFee;
    ISwapRouter public immutable router;

    constructor(ISwapRouter _router, address _tk1, address _tk2, uint24 _poolFee) {
        tk1 = _tk1;
        tk2 = _tk2;
        poolFee = _poolFee;
        router = _router;
    }

    function swapExactInputSingle (uint256 ammount) public {
        
        address recipient = msg.sender;
        TransferHelper.safeTransferFrom(tk1, recipient, address(this), ammount);
        TransferHelper.safeApprove(tk1, address(router), ammount);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({        
            tokenIn: tk1,
            tokenOut: tk2,
            fee: poolFee,
            recipient: recipient,
            deadline: block.timestamp,
            amountIn: ammount,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        router.exactInputSingle(params);
    }

    function swapExactOutputSingle (uint256 amountOut, uint256 ammountMax) public {
        address recipient = msg.sender;
        TransferHelper.safeTransferFrom(tk1, recipient, address(this), ammountMax);
        TransferHelper.safeApprove(tk1, address(router), ammountMax);

        ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter.ExactOutputSingleParams({        
            tokenIn: tk1,
            tokenOut: tk2,
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
            TransferHelper.safeApprove(tk1, address(router), 0);
            TransferHelper.safeTransfer(tk1, recipient,amountOut-actAmountOut);
        }
    }
}
