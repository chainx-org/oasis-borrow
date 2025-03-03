import { WithWalletConnection } from 'components/connectWallet/ConnectWallet'
import { AppLayout } from 'components/Layouts'
import { DefaultMultiplyVaultView } from 'features/openMultiplyVault/variants/default/open/DefaultMultiplyVaultView'
import { GuniOpenVaultView } from 'features/openMultiplyVault/variants/guni/open/GuniOpenVaultView'
import { WithTermsOfService } from 'features/termsOfService/TermsOfService'
import { GetServerSidePropsContext } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'
import { BackgroundLight } from 'theme/BackgroundLight'

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(ctx.locale!, ['common'])),
      ilk: ctx.query.ilk || null,
    },
  }
}

const multiplyContainerMap: Record<string, (ilk: string) => JSX.Element> = {
  'GUNIV3DAIUSDC1-A': (ilk) => <GuniOpenVaultView ilk={ilk} />,
  'GUNIV3DAIUSDC2-A': (ilk) => <GuniOpenVaultView ilk={ilk} />,
}
export default function OpenVault({ ilk }: { ilk: string }) {
  return (
    <WithWalletConnection>
      <WithTermsOfService>
        <BackgroundLight />
        {multiplyContainerMap[ilk] ? (
          multiplyContainerMap[ilk](ilk)
        ) : (
          <DefaultMultiplyVaultView ilk={ilk} />
        )}
      </WithTermsOfService>
    </WithWalletConnection>
  )
}

OpenVault.layout = AppLayout
