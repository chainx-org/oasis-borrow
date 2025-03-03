import { errorMessagesHandler, VaultErrorMessage } from '../form/errorMessagesHandler'
import { VaultWarningMessage, warningMessagesHandler } from '../form/warningMessagesHandler'
import { OpenGuniVaultState } from './openGuniVault'

export function validateGuniErrors(state: OpenGuniVaultState): OpenGuniVaultState {
  const {
    stage,
    isEditingStage,
    generateAmountMoreThanMaxFlashAmount,
    generateAmountLessThanDebtFloor,
    generateAmountExceedsDebtCeiling,
    customAllowanceAmountExceedsMaxUint256,
    customAllowanceAmountLessThanDepositAmount,
    exchangeError,
    ledgerWalletContractDataDisabled,
    depositAmountExceedsCollateralBalance,
  } = state
  const errorMessages: VaultErrorMessage[] = []

  if (isEditingStage) {
    errorMessages.push(
      ...errorMessagesHandler({
        depositAmountExceedsCollateralBalance,
        generateAmountLessThanDebtFloor,
        generateAmountExceedsDebtCeiling,
        exchangeError,
        generateAmountMoreThanMaxFlashAmount,
      }),
    )
  }

  if (stage === 'allowanceWaitingForConfirmation') {
    errorMessages.push(
      ...errorMessagesHandler({
        customAllowanceAmountExceedsMaxUint256,
        customAllowanceAmountLessThanDepositAmount,
      }),
    )
  }

  if (stage === 'txFailure' || stage === 'proxyFailure' || stage === 'allowanceFailure') {
    errorMessages.push(
      ...errorMessagesHandler({
        ledgerWalletContractDataDisabled,
      }),
    )
  }

  return { ...state, errorMessages }
}

export function validateGuniWarnings(state: OpenGuniVaultState): OpenGuniVaultState {
  const { errorMessages, isEditingStage, potentialGenerateAmountLessThanDebtFloor } = state

  const warningMessages: VaultWarningMessage[] = []

  if (errorMessages.length) return { ...state, warningMessages }

  if (isEditingStage) {
    warningMessages.push(
      ...warningMessagesHandler({
        potentialGenerateAmountLessThanDebtFloor,
      }),
    )
  }
  return { ...state, warningMessages }
}
