import { errorMessagesHandler, VaultErrorMessage } from '../form/errorMessagesHandler'
import { VaultWarningMessage, warningMessagesHandler } from '../form/warningMessagesHandler'
import { ManageVaultState } from './manageVault'

export function validateErrors(state: ManageVaultState): ManageVaultState {
  const {
    stage,
    withdrawAmountExceedsFreeCollateral,
    withdrawAmountExceedsFreeCollateralAtNextPrice,
    generateAmountExceedsDaiYieldFromTotalCollateral,
    generateAmountExceedsDaiYieldFromTotalCollateralAtNextPrice,
    generateAmountLessThanDebtFloor,
    debtWillBeLessThanDebtFloor,
    isEditingStage,
    customCollateralAllowanceAmountExceedsMaxUint256,
    customCollateralAllowanceAmountLessThanDepositAmount,
    customDaiAllowanceAmountExceedsMaxUint256,
    customDaiAllowanceAmountLessThanPaybackAmount,
    depositAmountExceedsCollateralBalance,
    depositingAllEthBalance,
    generateAmountExceedsDebtCeiling,
    paybackAmountExceedsDaiBalance,
    paybackAmountExceedsVaultDebt,
    withdrawCollateralOnVaultUnderDebtFloor,
    depositCollateralOnVaultUnderDebtFloor,
    ledgerWalletContractDataDisabled,
  } = state

  const errorMessages: VaultErrorMessage[] = []

  if (isEditingStage) {
    errorMessages.push(
      ...errorMessagesHandler({
        depositAmountExceedsCollateralBalance,
        withdrawAmountExceedsFreeCollateral,
        withdrawAmountExceedsFreeCollateralAtNextPrice,
        generateAmountExceedsDaiYieldFromTotalCollateral,
        generateAmountExceedsDaiYieldFromTotalCollateralAtNextPrice,
        generateAmountExceedsDebtCeiling,
        generateAmountLessThanDebtFloor,
        paybackAmountExceedsDaiBalance,
        paybackAmountExceedsVaultDebt,
        depositingAllEthBalance,
        debtWillBeLessThanDebtFloor,
        withdrawCollateralOnVaultUnderDebtFloor,
        depositCollateralOnVaultUnderDebtFloor,
      }),
    )
  }

  if (stage === 'collateralAllowanceWaitingForConfirmation') {
    errorMessages.push(
      ...errorMessagesHandler({
        customCollateralAllowanceAmountExceedsMaxUint256,
        customCollateralAllowanceAmountLessThanDepositAmount,
      }),
    )
  }

  if (stage === 'daiAllowanceWaitingForConfirmation') {
    errorMessages.push(
      ...errorMessagesHandler({
        customDaiAllowanceAmountExceedsMaxUint256,
        customDaiAllowanceAmountLessThanPaybackAmount,
      }),
    )
  }

  if (
    stage === 'manageFailure' ||
    stage === 'proxyFailure' ||
    stage === 'daiAllowanceFailure' ||
    stage === 'collateralAllowanceFailure'
  ) {
    errorMessages.push(
      ...errorMessagesHandler({
        ledgerWalletContractDataDisabled,
      }),
    )
  }

  return { ...state, errorMessages }
}

export function validateWarnings(state: ManageVaultState): ManageVaultState {
  const {
    errorMessages,
    isEditingStage,
    vaultWillBeAtRiskLevelDanger,
    vaultWillBeAtRiskLevelDangerAtNextPrice,
    vaultWillBeAtRiskLevelWarning,
    vaultWillBeAtRiskLevelWarningAtNextPrice,
    debtIsLessThanDebtFloor,
    potentialGenerateAmountLessThanDebtFloor,
  } = state

  const warningMessages: VaultWarningMessage[] = []

  if (errorMessages.length) return { ...state, warningMessages }

  if (isEditingStage) {
    warningMessages.push(
      ...warningMessagesHandler({
        potentialGenerateAmountLessThanDebtFloor,
        debtIsLessThanDebtFloor,
        vaultWillBeAtRiskLevelDanger,
        vaultWillBeAtRiskLevelDangerAtNextPrice,
        vaultWillBeAtRiskLevelWarning,
        vaultWillBeAtRiskLevelWarningAtNextPrice,
      }),
    )
  }
  return { ...state, warningMessages }
}
