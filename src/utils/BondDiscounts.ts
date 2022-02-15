import { Address, BigDecimal, BigInt, log} from '@graphprotocol/graph-ts'
import { ERC20 } from '../../generated/ProtocolMetrics/ERC20';
import { OlympusBondDepositoryV2 } from '../../generated/OlympusBondDepositoryV2/OlympusBondDepositoryV2';

import { BondDiscount } from '../../generated/schema'
import { BOND_DEPOSITORY, ERC20DAI_CONTRACT, ERC20FRAX_CONTRACT, SUSHI_OHMDAI_PAIRV2, SUSHI_OHMETH_PAIRV2 } from './Constants';
import { hourFromTimestamp } from './Dates';
import { toDecimal } from './Decimals';
import { getOHMUSDRate } from './Price';

export function loadOrCreateBondDiscount(timestamp: BigInt): BondDiscount{
    let hourTimestamp = hourFromTimestamp(timestamp);

    let bondDiscount = BondDiscount.load(hourTimestamp)
    if (bondDiscount == null) {
        bondDiscount = new BondDiscount(hourTimestamp)
        bondDiscount.timestamp = timestamp
        bondDiscount.dai_discount  = BigDecimal.fromString("0")
        bondDiscount.ohmdai_discount = BigDecimal.fromString("0")
        bondDiscount.frax_discount = BigDecimal.fromString("0")
        bondDiscount.ohmfrax_discount = BigDecimal.fromString("0")
        bondDiscount.eth_discount = BigDecimal.fromString("0")
        bondDiscount.lusd_discount = BigDecimal.fromString("0")
        bondDiscount.ohmlusd_discount = BigDecimal.fromString("0")
        bondDiscount.save()
    }
    return bondDiscount as BondDiscount
}

export function updateBondDiscounts(blockNumber: BigInt): void{
    var bd = loadOrCreateBondDiscount(blockNumber);
    var ohmRate = getOHMUSDRate(blockNumber);

    // BOND_DEPOSITORY
    var bondDepository = OlympusBondDepositoryV2.bind(Address.fromString(BOND_DEPOSITORY));
    var liveMarkets = bondDepository.liveMarkets();

    liveMarkets.forEach(elem => {
        var market = bondDepository.markets(elem);
        var price = bondDepository.marketPrice(elem);
        var metadata = bondDepository.metadata(elem);
        var erc20 = ERC20.bind(Address.fromString(market[1]));
        var name = erc20.name();
        var symbol = erc20.symbol();

        if ( Address.fromString(market[1]) === Address.fromString(ERC20DAI_CONTRACT) ){
            bd.dai_discount = ohmRate.div(toDecimal(price, 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
        }
        if ( Address.fromString(market[1]) === Address.fromString(ERC20FRAX_CONTRACT) ){
            bd.frax_discount = ohmRate.div(toDecimal(price, 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
        }
        if ( Address.fromString(market[1]) === Address.fromString(SUSHI_OHMDAI_PAIRV2) ){
            bd.ohmdai_discount = ohmRate.div(toDecimal(price, 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
        }
        if ( Address.fromString(market[1]) === Address.fromString(SUSHI_OHMETH_PAIRV2) ){
            bd.eth_discount = ohmRate.div(toDecimal(price, 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
        }

    });

    // //OHMDAI
    // if(blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT1_BLOCK))){
    //     let bond = OHMDAIBondV1.bind(Address.fromString(OHMDAISLPBOND_CONTRACT1))
    //     //bd.ohmdai_discount = ohmRate.div(toDecimal(bond.bondPriceInUSD(), 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
    // }
    // if(blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT2_BLOCK))){
    //     let bond = OHMDAIBondV2.bind(Address.fromString(OHMDAISLPBOND_CONTRACT2))
    //     //bd.ohmdai_discount = ohmRate.div(toDecimal(bond.bondPriceInUSD(), 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
    // }
    // if(blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT3_BLOCK))){
    //     let bond = OHMDAIBondV3.bind(Address.fromString(OHMDAISLPBOND_CONTRACT3))
    //     //bd.ohmdai_discount = ohmRate.div(toDecimal(bond.bondPriceInUSD(), 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
    // }
    // if(blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT4_BLOCK))){
    //     let bond = OHMDAIBondV4.bind(Address.fromString(OHMDAISLPBOND_CONTRACT4))
    //     let price_call = bond.try_bondPriceInUSD()
    //     if(price_call.reverted===false && price_call.value.gt(BigInt.fromI32(0))){
    //         bd.ohmdai_discount = ohmRate.div(toDecimal(price_call.value, 18))
    //         bd.ohmdai_discount = bd.ohmdai_discount.minus(BigDecimal.fromString("1"))
    //         bd.ohmdai_discount = bd.ohmdai_discount.times(BigDecimal.fromString("100"))
    //         log.debug("OHMDAI Discount OHM price {}  Bond Price {}  Discount {}", [ohmRate.toString(), price_call.value.toString(), bd.ohmfrax_discount.toString()])
    //     }
    // }

    // //DAI
    // if(blockNumber.gt(BigInt.fromString(DAIBOND_CONTRACTS1_BLOCK))){
    //     let bond = DAIBondV1.bind(Address.fromString(DAIBOND_CONTRACTS1))
    //     //bd.dai_discount = ohmRate.div(toDecimal(bond.bondPriceInUSD(), 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
    // }
    // if(blockNumber.gt(BigInt.fromString(DAIBOND_CONTRACTS2_BLOCK))){
    //     let bond = DAIBondV2.bind(Address.fromString(DAIBOND_CONTRACTS2))
    //     let price_call = bond.try_bondPriceInUSD()
    //     if(price_call.reverted===false && price_call.value.gt(BigInt.fromI32(0))){
    //         bd.dai_discount = ohmRate.div(toDecimal(price_call.value, 18))
    //         bd.dai_discount = bd.dai_discount.minus(BigDecimal.fromString("1"))
    //         bd.dai_discount = bd.dai_discount.times(BigDecimal.fromString("100"))
    //         log.debug("DAI Discount OHM price {}  Bond Price {}  Discount {}", [ohmRate.toString(), price_call.value.toString(), bd.ohmfrax_discount.toString()])
    //     }    
    // }
    
    // if(blockNumber.gt(BigInt.fromString(DAIBOND_CONTRACTS3_BLOCK))){
    //     let bond = DAIBondV3.bind(Address.fromString(DAIBOND_CONTRACTS3))
    //     let price_call = bond.try_bondPriceInUSD()
    //     if(price_call.reverted===false && price_call.value.gt(BigInt.fromI32(0))){
    //         bd.dai_discount = ohmRate.div(toDecimal(price_call.value, 18))
    //         bd.dai_discount = bd.dai_discount.minus(BigDecimal.fromString("1"))
    //         bd.dai_discount = bd.dai_discount.times(BigDecimal.fromString("100"))
    //         log.debug("DAI Discount OHM price {}  Bond Price {}  Discount {}", [ohmRate.toString(), price_call.value.toString(), bd.ohmfrax_discount.toString()])
    //     }    
    // }

    // //OHMFRAX
    // if(blockNumber.gt(BigInt.fromString(OHMFRAXLPBOND_CONTRACT1_BLOCK))){
    //     let bond = OHMFRAXBondV1.bind(Address.fromString(OHMFRAXLPBOND_CONTRACT1))
    //     let price_call = bond.try_bondPriceInUSD()
    //     if(price_call.reverted===false && price_call.value.gt(BigInt.fromI32(0))){
    //         bd.ohmfrax_discount = ohmRate.div(toDecimal(price_call.value, 18))
    //         bd.ohmfrax_discount = bd.ohmfrax_discount.minus(BigDecimal.fromString("1"))
    //         bd.ohmfrax_discount = bd.ohmfrax_discount.times(BigDecimal.fromString("100"))
    //         log.debug("OHMFRAX Discount OHM price {}  Bond Price {}  Discount {}", [ohmRate.toString(), price_call.value.toString(), bd.ohmfrax_discount.toString()])
    //     }
    // }
    // if(blockNumber.gt(BigInt.fromString(OHMFRAXLPBOND_CONTRACT2_BLOCK))){
    //     let bond = OHMFRAXBondV2.bind(Address.fromString(OHMFRAXLPBOND_CONTRACT2))
    //     let price_call = bond.try_bondPriceInUSD()
    //     if(price_call.reverted===false && price_call.value.gt(BigInt.fromI32(0))){
    //         bd.ohmfrax_discount = ohmRate.div(toDecimal(price_call.value, 18))
    //         bd.ohmfrax_discount = bd.ohmfrax_discount.minus(BigDecimal.fromString("1"))
    //         bd.ohmfrax_discount = bd.ohmfrax_discount.times(BigDecimal.fromString("100"))
    //         log.debug("OHMFRAX Discount OHM price {}  Bond Price {}  Discount {}", [ohmRate.toString(), price_call.value.toString(), bd.ohmfrax_discount.toString()])
    //     }
    // }

    // //FRAX
    // if(blockNumber.gt(BigInt.fromString(FRAXBOND_CONTRACT1_BLOCK))){
    //     let bond = FRAXBondV1.bind(Address.fromString(FRAXBOND_CONTRACT1))
    //     let price_call = bond.try_bondPriceInUSD()
    //     if(price_call.reverted===false && price_call.value.gt(BigInt.fromI32(0))){
    //         bd.frax_discount = ohmRate.div(toDecimal(price_call.value, 18))
    //         bd.frax_discount = bd.frax_discount.minus(BigDecimal.fromString("1"))
    //         bd.frax_discount = bd.frax_discount.times(BigDecimal.fromString("100"))
    //         log.debug("FRAX Discount OHM price {}  Bond Price {}  Discount {}", [ohmRate.toString(), price_call.value.toString(), bd.ohmfrax_discount.toString()])
    //     }
    // }

    // //ETH
    // if(blockNumber.gt(BigInt.fromString(ETHBOND_CONTRACT1_BLOCK))){
    //     let bond = ETHBondV1.bind(Address.fromString(ETHBOND_CONTRACT1))
    //     let price_call = bond.try_bondPriceInUSD()
    //     if(price_call.reverted===false && price_call.value.gt(BigInt.fromI32(0))){
    //         bd.eth_discount = ohmRate.div(toDecimal(price_call.value, 18))
    //         bd.eth_discount = bd.eth_discount.minus(BigDecimal.fromString("1"))
    //         bd.eth_discount = bd.eth_discount.times(BigDecimal.fromString("100"))
    //         log.debug("ETH Discount OHM price {}  Bond Price {}  Discount {}", [ohmRate.toString(), price_call.value.toString(), bd.ohmfrax_discount.toString()])
    //     }
    // }

    // //LUSD
    // if(blockNumber.gt(BigInt.fromString(LUSDBOND_CONTRACT1_BLOCK))){
    //     let bond = LUSDBondV1.bind(Address.fromString(LUSDBOND_CONTRACT1))
    //     let price_call = bond.try_bondPriceInUSD()
    //     if(price_call.reverted===false && price_call.value.gt(BigInt.fromI32(0))){
    //         bd.lusd_discount = ohmRate.div(toDecimal(price_call.value, 18))
    //         bd.lusd_discount = bd.lusd_discount.minus(BigDecimal.fromString("1"))
    //         bd.lusd_discount = bd.lusd_discount.times(BigDecimal.fromString("100"))
    //         log.debug("LUSD Discount OHM price {}  Bond Price {}  Discount {}", [ohmRate.toString(), price_call.value.toString(), bd.ohmfrax_discount.toString()])
    //     }
    // }

    // //OHMLUSD
    // if(blockNumber.gt(BigInt.fromString(OHMLUSDBOND_CONTRACT1_BLOCK))){
    //     let bond = OHMLUSDBondV1.bind(Address.fromString(OHMLUSDBOND_CONTRACT1))
    //     let price_call = bond.try_bondPriceInUSD()
    //     if(price_call.reverted===false && price_call.value.gt(BigInt.fromI32(0))){
    //         bd.ohmlusd_discount = ohmRate.div(toDecimal(price_call.value, 18))
    //         bd.ohmlusd_discount = bd.ohmlusd_discount.minus(BigDecimal.fromString("1"))
    //         bd.ohmlusd_discount = bd.ohmlusd_discount.times(BigDecimal.fromString("100"))
    //         log.debug("OHMLUSD Discount OHM price {}  Bond Price {}  Discount {}", [ohmRate.toString(), price_call.value.toString(), bd.ohmfrax_discount.toString()])
    //     }
    // }
    
    bd.save()
}