import { VaultAllowance, VaultAllowanceStatus } from 'components/vault/VaultAllowance'
import { VaultChangesWithADelayCard } from 'components/vault/VaultChangesWithADelayCard'
import { VaultErrors } from 'components/vault/VaultErrors'
import { VaultFormContainer } from 'components/vault/VaultFormContainer'
import { VaultProxyStatusCard } from 'components/vault/VaultProxy'
import { VaultWarnings } from 'components/vault/VaultWarnings'
import { Trans, useTranslation } from 'next-i18next'
import React from 'react'

import { OpenGuniVaultState } from '../../../../openGuniVault/openGuniVault'
import { OpenMultiplyVaultButton } from '../../../common/OpenMultiplyVaultButton'
import {
  OpenMultiplyVaultConfirmation,
  OpenMultiplyVaultStatus,
} from '../../../common/OpenMultiplyVaultConfirmation'
import { OpenMultiplyVaultTitle } from '../../../common/OpenMultiplyVaultTitle'
import { GuniOpenMultiplyVaultChangesInformation } from './GuniOpenMultiplyVaultChangesInformation'
import { GuniOpenMultiplyVaultEditing } from './GuniOpenMultiplyVaultEditing'

export function GuniOpenMultiplyVaultForm(props: OpenGuniVaultState) {
  const { isEditingStage, isProxyStage, isAllowanceStage, isOpenStage, stage } = props
  const { t } = useTranslation()

  return (
    <VaultFormContainer toggleTitle={t('open-vault.title')}>
      <OpenMultiplyVaultTitle
        {...props}
        title={t('vault-form.header.editWithToken', { token: 'GUNI' })}
        subTitle={
          <Trans i18nKey="vault-form.subtext.edit-multiply-dai" values={{ token: 'GUNIV3DAIUSDC' }}>
            This vault can be created by simply <strong>depositing DAI</strong>. The transaction
            will create the GUNIV3DAIUSDC position for you based on this DAI deposit
          </Trans>
        }
        token="DAI"
      />
      {isEditingStage && <GuniOpenMultiplyVaultEditing {...props} />}
      {isAllowanceStage && <VaultAllowance {...props} token="DAI" />}
      {isOpenStage && (
        <OpenMultiplyVaultConfirmation stage={props.stage}>
          <GuniOpenMultiplyVaultChangesInformation {...props} />
        </OpenMultiplyVaultConfirmation>
      )}
      <VaultErrors {...props} />
      <VaultWarnings {...props} />
      {stage === 'txSuccess' && <VaultChangesWithADelayCard />}
      <OpenMultiplyVaultButton {...props} token="DAI" />
      {isProxyStage && <VaultProxyStatusCard {...props} />}
      {isAllowanceStage && <VaultAllowanceStatus {...props} />}
      {isOpenStage && <OpenMultiplyVaultStatus {...props} />}
    </VaultFormContainer>
  )
}
