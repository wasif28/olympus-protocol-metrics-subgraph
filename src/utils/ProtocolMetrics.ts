import { Address, BigDecimal, BigInt, log} from '@graphprotocol/graph-ts'
import { OlympusERC20 } from '../../generated/ProtocolMetrics/OlympusERC20';
import { sOlympusERC20V2 } from '../../generated/ProtocolMetrics/sOlympusERC20V2';
import { ERC20 } from '../../generated/ProtocolMetrics/ERC20';
import { VeFXS } from '../../generated/ProtocolMetrics/VeFXS';
import { UniswapV2Pair } from '../../generated/ProtocolMetrics/UniswapV2Pair';
import { MasterChef } from '../../generated/ProtocolMetrics/MasterChef';
import { OlympusStakingV3, StakeCall } from '../../generated/ProtocolMetrics/OlympusStakingV3';
import { ConvexAllocator } from '../../generated/ProtocolMetrics/ConvexAllocator';
import { Distributor } from '../../generated/sOlympusERC20V3/Distributor';
import { ethereum } from '@graphprotocol/graph-ts'

import { ProtocolMetric } from '../../generated/schema'
// import { AAVE_ALLOCATOR, ADAI_ERC20_CONTRACT, ERC20DAI_CONTRACT, ERC20FRAX_CONTRACT, LUSD_ERC20_CONTRACT, OHMDAI_ONSEN_ID, ONSEN_ALLOCATOR, SUSHI_MASTERCHEF, SUSHI_OHMLUSD_PAIR, WETH_ERC20_CONTRACT, XSUSI_ERC20_CONTRACT, CVX_ERC20_CONTRACT, STAKING_CONTRACT_V3, TREASURY_ADDRESS_V3, SOHM_ERC20_CONTRACTV3, OHMV2_ERC20_CONTRACT, DAO_WALLET, SUSHI_OHMETH_PAIRV2, SUSHI_OHMDAI_PAIRV2, UNI_OHMFRAX_PAIRV2, CONVEX_CVX_ALLOCATOR, VLCVX_ERC20_CONTRACT, FXS_ERC20_CONTRACT, VEFXSERC20_CONTRACT, VEFXS_ALLOCATOR, OHMLUSD_ONSEN_ID, CONVEX_ALLOCATOR3, WBTC_ERC20_CONTRACT, UST_ERC20_CONTRACT, DISTRIBUTOR_CONTRACT_V2 } from './Constants';
import { ERC20DAI_CONTRACT, ERC20FRAX_CONTRACT, SUSHI_MASTERCHEF, WETH_ERC20_CONTRACT, STAKING_CONTRACT_V3, TREASURY_ADDRESS_V3, SOHM_ERC20_CONTRACTV3, OHMV2_ERC20_CONTRACT, DAO_WALLET, SUSHI_OHMETH_PAIRV2, SUSHI_OHMDAI_PAIRV2, DISTRIBUTOR_CONTRACT_V2 } from './Constants';
import { dayFromTimestamp } from './Dates';
import { toDecimal } from './Decimals';
// import { getOHMUSDRate, getDiscountedPairUSD, getPairUSD, getXsushiUSDRate, getETHUSDRate, getPairWETH, getCVXUSDRate, getFXSUSDRate, getBTCUSDRate } from './Price';
import { getOHMUSDRate, getDiscountedPairUSD, getPairUSD, getETHUSDRate, getPairWETH } from './Price';
// import { updateBondDiscounts } from './BondDiscounts';

export function loadOrCreateProtocolMetric(timestamp: BigInt): ProtocolMetric{
    let dayTimestamp = dayFromTimestamp(timestamp);

    let protocolMetric = ProtocolMetric.load(dayTimestamp)
    if (protocolMetric == null) {
        protocolMetric = new ProtocolMetric(dayTimestamp)
        protocolMetric.timestamp = timestamp
        protocolMetric.ohmCirculatingSupply = BigDecimal.fromString("0")
        protocolMetric.sOhmCirculatingSupply = BigDecimal.fromString("0")
        protocolMetric.totalSupply = BigDecimal.fromString("0")
        protocolMetric.ohmPrice = BigDecimal.fromString("0")
        protocolMetric.marketCap = BigDecimal.fromString("0")
        protocolMetric.totalValueLocked = BigDecimal.fromString("0")
        protocolMetric.treasuryRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryMarketValue = BigDecimal.fromString("0")
        protocolMetric.nextEpochRebase = BigDecimal.fromString("0")
        protocolMetric.nextDistributedOhm = BigDecimal.fromString("0")
        protocolMetric.currentAPY = BigDecimal.fromString("0")
        protocolMetric.treasuryDaiRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryFraxRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryLusdRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryDaiMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryFraxMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryLusdMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryUstMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryXsushiMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryWETHRiskFreeValue = BigDecimal.fromString("0")
        protocolMetric.treasuryWETHMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryWBTCMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryCVXMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryOtherMarketValue = BigDecimal.fromString("0")
        protocolMetric.treasuryOhmDaiPOL = BigDecimal.fromString("0")
        protocolMetric.treasuryOhmFraxPOL = BigDecimal.fromString("0")
        protocolMetric.treasuryOhmLusdPOL = BigDecimal.fromString("0")
        protocolMetric.treasuryOhmEthPOL = BigDecimal.fromString("0")
        protocolMetric.treasuryStableBacking = BigDecimal.fromString("0")
        protocolMetric.treasuryLPValue = BigDecimal.fromString("0")
        protocolMetric.treasuryVolatileBacking = BigDecimal.fromString("0")
        protocolMetric.treasuryTotalBacking = BigDecimal.fromString("0")

        protocolMetric.save()
    }
    return protocolMetric as ProtocolMetric
}

function getOHMMarketcap(blockNumber: BigInt): BigDecimal{
    //Used to calculate current marketcap
    let marketCap = getOHMUSDRate(blockNumber).times(getCriculatingSupply(blockNumber, getTotalSupply(blockNumber)))
    log.debug("Market Cap current: {}", [marketCap.toString()])

    log.debug("Market Cap total: {}", [marketCap.toString()])

    return marketCap
}

function getTotalSupply(blockNumber: BigInt): BigDecimal{
    let ohm_contract = OlympusERC20.bind(Address.fromString(OHMV2_ERC20_CONTRACT))
    let total_supply = toDecimal(ohm_contract.totalSupply(), 9)

    log.debug("Total Supply {}", [total_supply.toString()])
    return total_supply
}

function getCriculatingSupply(blockNumber: BigInt, total_supply: BigDecimal): BigDecimal{
    let ohm_contract = OlympusERC20.bind(Address.fromString(OHMV2_ERC20_CONTRACT))
    let circ_supply = total_supply.minus(toDecimal(ohm_contract.balanceOf(Address.fromString(DAO_WALLET)), 9))

    log.debug("Circulating Supply {}", [circ_supply.toString()])
    return circ_supply
}

function getSohmSupply(blockNumber: BigInt): BigDecimal{
    let sohm_supply = BigDecimal.fromString("0")
    let sohm_contract_v3 = sOlympusERC20V2.bind(Address.fromString(SOHM_ERC20_CONTRACTV3))
    sohm_supply = toDecimal(sohm_contract_v3.circulatingSupply(), 9)
    
    log.debug("sOHM Supply {}", [sohm_supply.toString()])
    return sohm_supply
}

function getMV_RFV(blockNumber: BigInt): BigDecimal[]{
    let daiERC20 = ERC20.bind(Address.fromString(ERC20DAI_CONTRACT))
    let fraxERC20 = ERC20.bind(Address.fromString(ERC20FRAX_CONTRACT))
    // let aDaiERC20 = ERC20.bind(Address.fromString(ADAI_ERC20_CONTRACT))
    // let xSushiERC20 = ERC20.bind(Address.fromString(XSUSI_ERC20_CONTRACT))
    let wethERC20 = ERC20.bind(Address.fromString(WETH_ERC20_CONTRACT))
    // let lusdERC20 = ERC20.bind(Address.fromString(LUSD_ERC20_CONTRACT))
    // let wbtcERC20 = ERC20.bind(Address.fromString(WBTC_ERC20_CONTRACT))
    // let ustERC20 = ERC20.bind(Address.fromString(UST_ERC20_CONTRACT))

    let ohmdaiPairV2 = UniswapV2Pair.bind(Address.fromString(SUSHI_OHMDAI_PAIRV2))
    let ohmdaiOnsenMC = MasterChef.bind(Address.fromString(SUSHI_MASTERCHEF))
    // let ohmfraxPairV2 = UniswapV2Pair.bind(Address.fromString(UNI_OHMFRAX_PAIRV2))

    // let ohmlusdPair = UniswapV2Pair.bind(Address.fromString(SUSHI_OHMLUSD_PAIR))
    let ohmethPairv2 = UniswapV2Pair.bind(Address.fromString(SUSHI_OHMETH_PAIRV2))

    let daiBalance = daiERC20.balanceOf(Address.fromString(TREASURY_ADDRESS_V3))
    // let adaiBalance = aDaiERC20.balanceOf(Address.fromString(AAVE_ALLOCATOR))
    let fraxBalance = fraxERC20.balanceOf(Address.fromString(TREASURY_ADDRESS_V3))
    
    //Cross chain assets that can not be tracked right now 20000000
    // tokemak 7.5 MM
    // butterfly 10% MC = 45MM
    let volatile_value = BigDecimal.fromString("72500000") 

    // let xSushiBalance = xSushiERC20.balanceOf(Address.fromString(TREASURY_ADDRESS_V3))
    // let xSushi_value = toDecimal(xSushiBalance, 18).times(getXsushiUSDRate())
    // volatile_value = volatile_value.plus(xSushi_value)
    // log.debug("xSushi_value {}", [xSushi_value.toString()])

    let cvx_value = BigDecimal.fromString("0")

    // let cvxERC20 = ERC20.bind(Address.fromString(CVX_ERC20_CONTRACT))

    // let cvxBalance = cvxERC20.balanceOf(Address.fromString(TREASURY_ADDRESS_V3))
    // log.debug("CVXbalance {}", [cvxBalance.toString()])
    // cvx_value = toDecimal(cvxBalance, 18).times(getCVXUSDRate())

    // let vlERC20 = ERC20.bind(Address.fromString(VLCVX_ERC20_CONTRACT))
    
    // let vlCVXbalance = vlERC20.balanceOf(Address.fromString(CONVEX_CVX_ALLOCATOR))
    // log.debug("vlCVXbalance {}", [vlCVXbalance.toString()])
    // cvx_value = cvx_value.plus(toDecimal(vlCVXbalance, 18).times(getCVXUSDRate()))
    
    log.debug("cvx_value {}", [cvx_value.toString()])
    volatile_value = volatile_value.plus(cvx_value)

    let fxs_value = BigDecimal.fromString("0")
    // let fxsERC20 = ERC20.bind(Address.fromString(FXS_ERC20_CONTRACT))
    
    // let fxsbalance = fxsERC20.balanceOf(Address.fromString(TREASURY_ADDRESS_V3))
    // fxs_value = toDecimal(fxsbalance, 18).times(getFXSUSDRate())
    log.debug("fxs_value {}", [fxs_value.toString()])
    volatile_value = volatile_value.plus(fxs_value)

    let vefxs_value = BigDecimal.fromString("0")
    // let veFXS = VeFXS.bind(Address.fromString(VEFXSERC20_CONTRACT))
    
    // let vefxsbalance = veFXS.locked(Address.fromString(VEFXS_ALLOCATOR)).value0
    // vefxs_value = toDecimal(vefxsbalance, 18).times(getFXSUSDRate())
    log.debug("vefxs_value {}", [vefxs_value.toString()])
    volatile_value = volatile_value.plus(vefxs_value)



    let wethBalance = wethERC20.balanceOf(Address.fromString(TREASURY_ADDRESS_V3))
    let weth_value = toDecimal(wethBalance, 18).times(getETHUSDRate())

    // let wbtcBalance = wbtcERC20.balanceOf(Address.fromString(TREASURY_ADDRESS_V3))
    // let wbtc_value = toDecimal(wbtcBalance, 8).times(getBTCUSDRate())

    let lusdBalance = BigInt.fromI32(0)

    // lusdBalance = lusdERC20.balanceOf(Address.fromString(TREASURY_ADDRESS_V3))
    

    let ustBalance = BigInt.fromI32(0)

    // ustBalance = ustERC20.balanceOf(Address.fromString(TREASURY_ADDRESS_V3)).times(BigInt.fromString("1000000000000"))
    

    // CONVEX Frax allocator
    // TODO add to mv and mvrfv
    let convexrfv =  BigInt.fromString("0");
    // let allocator3 = ConvexAllocator.bind(Address.fromString(CONVEX_ALLOCATOR3))
    // convexrfv = convexrfv.plus(allocator3.totalValueDeployed())

    // Multiplied by 10e9 for consistency
    convexrfv = convexrfv.times(BigInt.fromString("1000000000"))
    fraxBalance = fraxBalance.plus(convexrfv)

    //OHMDAIv2
    let ohmdaiSushiBalancev2 = BigInt.fromI32(0)
    let ohmdai_valuev2 = BigDecimal.fromString("0")
    let ohmdai_rfvv2 = BigDecimal.fromString("0")
    let ohmdaiTotalLPv2 = BigDecimal.fromString("0")
    let ohmdaiPOLv2 = BigDecimal.fromString("0")
    ohmdaiSushiBalancev2 = ohmdaiPairV2.balanceOf(Address.fromString(TREASURY_ADDRESS_V3))
    ohmdai_valuev2 = getPairUSD(ohmdaiSushiBalancev2, SUSHI_OHMDAI_PAIRV2, blockNumber)
    ohmdai_rfvv2 = getDiscountedPairUSD(ohmdaiSushiBalancev2, SUSHI_OHMDAI_PAIRV2)
    ohmdaiTotalLPv2 = toDecimal(ohmdaiPairV2.totalSupply(), 18)
    if (ohmdaiTotalLPv2.gt(BigDecimal.fromString("0")) &&  ohmdaiSushiBalancev2.gt(BigInt.fromI32(0))){
            ohmdaiPOLv2 = toDecimal(ohmdaiSushiBalancev2, 18).div(ohmdaiTotalLPv2).times(BigDecimal.fromString("100"))
        }

    let ohmdaiPOL = toDecimal(ohmdaiSushiBalancev2, 18).div(ohmdaiTotalLPv2).times(BigDecimal.fromString("100"))

    let ohmdai_v2value = getPairUSD(ohmdaiSushiBalancev2, SUSHI_OHMDAI_PAIRV2, blockNumber)
    log.debug("ohmdai_v2value {}", [ohmdai_v2value.toString()])
    let ohmdai_value = (ohmdai_v2value)
    
    let ohmdai_rfv = (getDiscountedPairUSD(ohmdaiSushiBalancev2, SUSHI_OHMDAI_PAIRV2))

    // OHMFRAX
    let ohmfraxBalance = BigInt.fromI32(0)
    let ohmfrax_value = BigDecimal.fromString("0")
    let ohmfrax_rfv = BigDecimal.fromString("0")
    let ohmfraxTotalLP = BigDecimal.fromString("0")
    let ohmfraxPOL = BigDecimal.fromString("0")

    // ohmfraxBalance = ohmfraxPairV2.balanceOf(Address.fromString(TREASURY_ADDRESS_V3))
    // ohmfrax_value = ohmfrax_rfv.plus(getPairUSD(ohmfraxBalance, UNI_OHMFRAX_PAIRV2, blockNumber))
    // ohmfrax_rfv = ohmfrax_rfv.plus(getDiscountedPairUSD(ohmfraxBalance, UNI_OHMFRAX_PAIRV2))
    // ohmfraxTotalLP = toDecimal(ohmfraxPairV2.totalSupply(), 18)
    if (ohmfraxTotalLP.gt(BigDecimal.fromString("0")) &&  ohmfraxBalance.gt(BigInt.fromI32(0))){
        ohmfraxPOL = ohmfraxPOL.plus(toDecimal(ohmfraxBalance, 18).div(ohmfraxTotalLP).times(BigDecimal.fromString("100")))
    }

    //OHMLUSD
    let ohmlusdBalance = BigInt.fromI32(0)
    let ohmlusd_value = BigDecimal.fromString("0")
    let ohmlusd_rfv = BigDecimal.fromString("0")
    let ohmlusdTotalLP = BigDecimal.fromString("0")
    let ohmlusdPOL = BigDecimal.fromString("0")
        
    // ohmlusdBalance = (ohmlusdPair.balanceOf(Address.fromString(TREASURY_ADDRESS_V3)))

        // let ohmlusdOnsenBalance = ohmdaiOnsenMC.userInfo(BigInt.fromI32(OHMLUSD_ONSEN_ID), Address.fromString(ONSEN_ALLOCATOR)).value0
        // ohmlusdBalance = ohmlusdBalance.plus(ohmlusdOnsenBalance)

        // ohmlusd_value = getPairUSD(ohmlusdBalance, SUSHI_OHMLUSD_PAIR, blockNumber)

        log.debug("ohmlusd_value {}", [ohmlusd_value.toString()])

        // ohmlusd_rfv = getDiscountedPairUSD(ohmlusdBalance, SUSHI_OHMLUSD_PAIR)
        // ohmlusdTotalLP = toDecimal(ohmlusdPair.totalSupply(), 18)
        if (ohmlusdTotalLP.gt(BigDecimal.fromString("0")) &&  ohmlusdBalance.gt(BigInt.fromI32(0))){
            ohmlusdPOL = toDecimal(ohmlusdBalance, 18).div(ohmlusdTotalLP).times(BigDecimal.fromString("100"))
        }

    //OHMETH
    let ohmethBalance = BigInt.fromI32(0)
    let ohmeth_value = BigDecimal.fromString("0")
    let ohmeth_rfv = BigDecimal.fromString("0")
    let ohmethTotalLP = BigDecimal.fromString("0")
    let ohmethPOL = BigDecimal.fromString("0")

        ohmethBalance = ohmethPairv2.balanceOf(Address.fromString(TREASURY_ADDRESS_V3))
        log.debug("ohmethBalance {}", [ohmethBalance.toString()])

        ohmeth_value = getPairWETH(ohmethBalance, SUSHI_OHMETH_PAIRV2, blockNumber)
        log.debug("ohmeth_value {}", [ohmeth_value.toString()])

        ohmeth_rfv = getDiscountedPairUSD(ohmethBalance, SUSHI_OHMETH_PAIRV2)
        ohmethTotalLP = toDecimal(ohmethPairv2.totalSupply(), 18)
        if (ohmethTotalLP.gt(BigDecimal.fromString("0")) &&  ohmethBalance.gt(BigInt.fromI32(0))){
            ohmethPOL = toDecimal(ohmethBalance, 18).div(ohmethTotalLP).times(BigDecimal.fromString("100"))
        }

    // let stableValue = daiBalance.plus(fraxBalance).plus(adaiBalance).plus(lusdBalance).plus(ustBalance)
    let stableValue = daiBalance.plus(fraxBalance).plus(lusdBalance).plus(ustBalance) //temp
    let stableValueDecimal = toDecimal(stableValue, 18)

    let lpValue = ohmdai_value.plus(ohmfrax_value).plus(ohmlusd_value).plus(ohmeth_value)
    let rfvLpValue = ohmdai_rfv.plus(ohmfrax_rfv).plus(ohmlusd_rfv).plus(ohmeth_rfv)

    // let mv = stableValueDecimal.plus(lpValue).plus(weth_value).plus(wbtc_value).plus(volatile_value)
    let mv = stableValueDecimal.plus(lpValue).plus(weth_value).plus(volatile_value) // temp
    let rfv = stableValueDecimal.plus(rfvLpValue)

    let treasuryStableBacking = stableValueDecimal
    // let treasuryVolatileBacking = volatile_value.plus(weth_value).plus(wbtc_value)
    let treasuryVolatileBacking = volatile_value.plus(weth_value) // temp
    let treasuryTotalBacking = treasuryStableBacking.plus(treasuryVolatileBacking)
    let treasuryLPValue = lpValue

    log.debug("Treasury Market Value {}", [mv.toString()])
    log.debug("Treasury RFV {}", [rfv.toString()])
    log.debug("Treasury DAI value {}", [toDecimal(daiBalance, 18).toString()])
    // log.debug("Treasury aDAI value {}", [toDecimal(adaiBalance, 18).toString()])
    // log.debug("Treasury xSushi value {}", [xSushi_value.toString()])
    log.debug("Treasury WETH value {}", [weth_value.toString()])
    log.debug("Treasury LUSD value {}", [toDecimal(lusdBalance, 18).toString()])
    log.debug("Treasury OHM-DAI RFV {}", [ohmdai_rfv.toString()])
    log.debug("Treasury Frax value {}", [toDecimal(fraxBalance, 18).toString()])
    log.debug("Treasury OHM-FRAX RFV {}", [ohmfrax_rfv.toString()])
    log.debug("Treasury OHM-LUSD RFV {}", [ohmlusd_rfv.toString()])
    log.debug("Convex Allocator {}", [toDecimal(convexrfv, 18).toString()])

    return [
        mv, 
        rfv,
        // treasuryDaiRiskFreeValue = DAI RFV * DAI + aDAI
        // ohmdai_rfv.plus(toDecimal(daiBalance, 18)).plus(toDecimal(adaiBalance, 18)),
        ohmdai_rfv.plus(toDecimal(daiBalance, 18)), //temp
        // treasuryFraxRiskFreeValue = FRAX RFV * FRAX
        ohmfrax_rfv.plus(toDecimal(fraxBalance, 18)),
        // treasuryDaiMarketValue = DAI LP * DAI + aDAI
        // ohmdai_value.plus(toDecimal(daiBalance, 18)).plus(toDecimal(adaiBalance, 18)),
        ohmdai_value.plus(toDecimal(daiBalance, 18)), //temp
        // treasuryFraxMarketValue = FRAX LP * FRAX
        ohmfrax_value.plus(toDecimal(fraxBalance, 18)),
        // xSushi_value,
        BigDecimal.fromString("0"), //temp
        ohmeth_rfv.plus(weth_value),
        ohmeth_value.plus(weth_value),
        ohmlusd_rfv.plus(toDecimal(lusdBalance, 18)),
        ohmlusd_value.plus(toDecimal(lusdBalance, 18)),
        cvx_value,
        // POL
        ohmdaiPOL,
        ohmfraxPOL,
        ohmlusdPOL,
        ohmethPOL,
        volatile_value,
        // wbtc_value,
        BigDecimal.fromString("0"), //temp
        toDecimal(ustBalance, 18),
        treasuryStableBacking,
        treasuryVolatileBacking,
        treasuryTotalBacking,
        treasuryLPValue
    ]
}

function getNextOHMRebase(blockNumber: BigInt): BigDecimal{
    let next_distribution = BigDecimal.fromString("0")

        let staking_contract_v3 = OlympusStakingV3.bind(Address.fromString(STAKING_CONTRACT_V3))
        let distribution_v3 = toDecimal(staking_contract_v3.epoch().value3,9)
        log.debug("next_distribution v3 {}", [distribution_v3.toString()])
        next_distribution = next_distribution.plus(distribution_v3)

    log.debug("next_distribution total {}", [next_distribution.toString()])

    return next_distribution
}

function getAPY_Rebase(sOHM: BigDecimal, distributedOHM: BigDecimal): BigDecimal[]{
    let nextEpochRebase = distributedOHM.div(sOHM).times(BigDecimal.fromString("100"));

    let nextEpochRebase_number = Number.parseFloat(nextEpochRebase.toString())
    let currentAPY = Math.pow(((nextEpochRebase_number/100)+1), (365*3)-1)*100

    let currentAPYdecimal = BigDecimal.fromString(currentAPY.toString())

    log.debug("next_rebase {}", [nextEpochRebase.toString()])
    log.debug("current_apy total {}", [currentAPYdecimal.toString()])

    return [currentAPYdecimal, nextEpochRebase]
}

function getRunway(totalSupply: BigDecimal, rfv: BigDecimal, rebase: BigDecimal, block: ethereum.Block): BigDecimal[]{
    let runway2dot5k = BigDecimal.fromString("0")
    let runway5k = BigDecimal.fromString("0")
    let runway7dot5k = BigDecimal.fromString("0")
    let runway10k = BigDecimal.fromString("0")
    let runway20k = BigDecimal.fromString("0")
    let runway50k = BigDecimal.fromString("0")
    let runway70k = BigDecimal.fromString("0")
    let runway100k = BigDecimal.fromString("0")
    let runwayCurrent = BigDecimal.fromString("0")

    if(totalSupply.gt(BigDecimal.fromString("0")) && rfv.gt(BigDecimal.fromString("0")) &&  rebase.gt(BigDecimal.fromString("0"))){
        log.debug("Runway RFV", [rfv.toString()])
        log.debug("Runway totalSupply", [totalSupply.toString()])

        let treasury_runway = Number.parseFloat(rfv.div(totalSupply).toString())

        let runway2dot5k_num = (Math.log(treasury_runway) / Math.log(1+0.0029438))/3;
        let runway5k_num = (Math.log(treasury_runway) / Math.log(1+0.003579))/3;
        let runway7dot5k_num = (Math.log(treasury_runway) / Math.log(1+0.0039507))/3;
        let runway10k_num = (Math.log(treasury_runway) / Math.log(1+0.00421449))/3;
        let runway20k_num = (Math.log(treasury_runway) / Math.log(1+0.00485037))/3;
        let runway50k_num = (Math.log(treasury_runway) / Math.log(1+0.00569158))/3;
        let runway70k_num = (Math.log(treasury_runway) / Math.log(1+0.00600065))/3;
        let runway100k_num = (Math.log(treasury_runway) / Math.log(1+0.00632839))/3;
        let nextEpochRebase_number = Number.parseFloat(rebase.toString())/100

            let distributorContract_v2 = Distributor.bind(Address.fromString(DISTRIBUTOR_CONTRACT_V2))
            nextEpochRebase_number = Number.parseFloat(toDecimal(distributorContract_v2.info(BigInt.fromI32(0)).value0,6).toString())
            
        log.debug("Runway rebase", [nextEpochRebase_number.toString()])

        let runwayCurrent_num = (Math.log(treasury_runway) / Math.log(1+nextEpochRebase_number))/3;
        
        runway2dot5k = BigDecimal.fromString(runway2dot5k_num.toString())
        runway5k = BigDecimal.fromString(runway5k_num.toString())
        runway7dot5k = BigDecimal.fromString(runway7dot5k_num.toString())
        runway10k = BigDecimal.fromString(runway10k_num.toString())
        runway20k = BigDecimal.fromString(runway20k_num.toString())
        runway50k = BigDecimal.fromString(runway50k_num.toString())
        runway70k = BigDecimal.fromString(runway70k_num.toString())
        runway100k = BigDecimal.fromString(runway100k_num.toString())
        runwayCurrent = BigDecimal.fromString(runwayCurrent_num.toString())
    }

    return [runway2dot5k, runway5k, runway7dot5k, runway10k, runway20k, runway50k, runway70k, runway100k, runwayCurrent]
}


export function updateProtocolMetrics(block: ethereum.Block): void{
    let blockNumber = block.number;

    let pm = loadOrCreateProtocolMetric(block.timestamp);

    //Total Supply
    pm.totalSupply = getTotalSupply(blockNumber)

    //Circ Supply
    pm.ohmCirculatingSupply = getCriculatingSupply(blockNumber, pm.totalSupply)

    //sOhm Supply
    pm.sOhmCirculatingSupply = getSohmSupply(blockNumber)

    //OHM Price
    pm.ohmPrice = getOHMUSDRate(block.number)

    //OHM Market Cap
    pm.marketCap = getOHMMarketcap(block.number)

    //Total Value Locked
    pm.totalValueLocked = pm.sOhmCirculatingSupply.times(pm.ohmPrice)

    //Treasury RFV and MV
    let mv_rfv = getMV_RFV(blockNumber)
    pm.treasuryMarketValue = mv_rfv[0]
    pm.treasuryRiskFreeValue = mv_rfv[1]
    pm.treasuryDaiRiskFreeValue = mv_rfv[2]
    pm.treasuryFraxRiskFreeValue = mv_rfv[3]
    pm.treasuryDaiMarketValue = mv_rfv[4]
    pm.treasuryFraxMarketValue = mv_rfv[5]
    pm.treasuryXsushiMarketValue = mv_rfv[6]
    pm.treasuryWETHRiskFreeValue = mv_rfv[7]
    pm.treasuryWETHMarketValue = mv_rfv[8]
    pm.treasuryLusdRiskFreeValue = mv_rfv[9]
    pm.treasuryLusdMarketValue = mv_rfv[10]
    pm.treasuryCVXMarketValue = mv_rfv[11]
    pm.treasuryOhmDaiPOL = mv_rfv[12]
    pm.treasuryOhmFraxPOL = mv_rfv[13]
    pm.treasuryOhmLusdPOL = mv_rfv[14]
    pm.treasuryOhmEthPOL = mv_rfv[15]
    pm.treasuryOtherMarketValue = mv_rfv[16]
    pm.treasuryWBTCMarketValue = mv_rfv[17]
    pm.treasuryUstMarketValue = mv_rfv[18]
    pm.treasuryStableBacking = mv_rfv[19]
    pm.treasuryVolatileBacking = mv_rfv[20]
    pm.treasuryTotalBacking = mv_rfv[21]
    pm.treasuryLPValue = mv_rfv[22]

    // Rebase rewards, APY, rebase
    pm.nextDistributedOhm = getNextOHMRebase(blockNumber)
    let apy_rebase = getAPY_Rebase(pm.sOhmCirculatingSupply, pm.nextDistributedOhm)
    pm.currentAPY = apy_rebase[0]
    pm.nextEpochRebase = apy_rebase[1]

    //Runway
    let runways = getRunway(pm.totalSupply, pm.treasuryRiskFreeValue, pm.nextEpochRebase, block)
    pm.runway2dot5k = runways[0]
    pm.runway5k = runways[1]
    pm.runway7dot5k = runways[2]
    pm.runway10k = runways[3]
    pm.runway20k = runways[4]
    pm.runway50k = runways[5]
    pm.runway70k = runways[6]
    pm.runway100k = runways[7]
    pm.runwayCurrent = runways[8]
  
    pm.save()
    
    // updateBondDiscounts(blockNumber)
}

export function handleMetrics(call: StakeCall): void {
    updateProtocolMetrics(call.block)
}