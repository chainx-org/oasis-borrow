import {
  AfterPillProps,
  getAfterPillColors,
  getCollRatioColor,
  VaultDetailsBuyingPowerModal,
  VaultDetailsCard,
  VaultDetailsCardCurrentPrice,
  VaultDetailsCardLiquidationPrice,
  VaultDetailsCardNetValue,
  VaultDetailsSummaryContainer,
  VaultDetailsSummaryItem,
} from 'components/vault/VaultDetails'
import { formatAmount, formatCryptoBalance } from 'helpers/formatters/format'
import { useModal } from 'helpers/modalHook'
import { zero } from 'helpers/zero'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { Box, Grid } from 'theme-ui'

import { ManageMultiplyVaultState } from '../../../../manageMultiplyVault/manageMultiplyVault'

function DefaultManageMultiplyVaultDetailsSummary({
  vault: { debt, token, lockedCollateral },
  afterDebt,
  afterPillColors,
  showAfterPill,
  multiply,
  afterMultiply,
  afterLockedCollateral,
}: ManageMultiplyVaultState & AfterPillProps) {
  const { t } = useTranslation()

  return (
    <VaultDetailsSummaryContainer>
      <VaultDetailsSummaryItem
        label={t('system.vault-dai-debt')}
        value={
          <>
            {formatAmount(debt, 'DAI')}
            {` DAI`}
          </>
        }
        valueAfter={
          showAfterPill && (
            <>
              {formatAmount(afterDebt, 'DAI')}
              {` DAI`}
            </>
          )
        }
        afterPillColors={afterPillColors}
      />

      <VaultDetailsSummaryItem
        label={t('system.total-exposure', { token })}
        value={
          <>
            {formatCryptoBalance(lockedCollateral)} {token}
          </>
        }
        valueAfter={
          showAfterPill && (
            <>
              {formatCryptoBalance(afterLockedCollateral || zero)} {token}
            </>
          )
        }
        afterPillColors={afterPillColors}
      />
      <VaultDetailsSummaryItem
        label={t('system.multiple')}
        value={<>{multiply?.toFixed(2)}x</>}
        valueAfter={showAfterPill && <>{afterMultiply?.toFixed(2)}x</>}
        afterPillColors={afterPillColors}
      />
    </VaultDetailsSummaryContainer>
  )
}

export function DefaultManageMultiplyVaultDetails(props: ManageMultiplyVaultState) {
  const {
    vault: { token, liquidationPrice },
    liquidationPriceCurrentPriceDifference,
    afterLiquidationPrice,
    afterCollateralizationRatio,
    inputAmountsEmpty,
    stage,
    netValueUSD,
    afterNetValueUSD,
    buyingPower,
    buyingPowerUSD,
    afterBuyingPowerUSD,
    currentPnL,
    marketPrice,
    totalGasSpentUSD,
    vault,
    priceInfo,
  } = props
  const openModal = useModal()
  const afterCollRatioColor = getCollRatioColor(props, afterCollateralizationRatio)
  const afterPillColors = getAfterPillColors(afterCollRatioColor)
  const showAfterPill = !inputAmountsEmpty && stage !== 'manageSuccess'

  return (
    <Box>
      <Grid variant="vaultDetailsCardsContainer">
        <VaultDetailsCardLiquidationPrice
          {...{
            liquidationPrice,
            liquidationPriceCurrentPriceDifference,
            afterLiquidationPrice,
            afterPillColors,
            showAfterPill,
          }}
        />

        <VaultDetailsCard
          title={`Buying Power`}
          value={`$${formatAmount(buyingPowerUSD, 'USD')}`}
          valueBottom={`${formatAmount(buyingPower, token)} ${token}`}
          valueAfter={showAfterPill && `$${formatAmount(afterBuyingPowerUSD, 'USD')}`}
          openModal={() => openModal(VaultDetailsBuyingPowerModal)}
          afterPillColors={afterPillColors}
        />

        <VaultDetailsCardCurrentPrice {...props} />

        <VaultDetailsCardNetValue
          {...{
            netValueUSD,
            afterNetValueUSD,
            afterPillColors,
            showAfterPill,
            currentPnL,
            marketPrice,
            totalGasSpentUSD,
            vault,
            priceInfo,
          }}
        />
      </Grid>
      <DefaultManageMultiplyVaultDetailsSummary
        {...props}
        afterPillColors={afterPillColors}
        showAfterPill={showAfterPill}
      />
    </Box>
  )
}
