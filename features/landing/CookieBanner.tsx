import { Icon } from '@makerdao/dai-ui-icons'
import { ChevronUpDown } from 'components/ChevronUpDown'
import { AppLink } from 'components/Links'
import React, { MouseEventHandler, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Box, Button, Container, Flex, Grid, Text } from 'theme-ui'

function Checkbox({
  checked,
  onClick,
}: {
  checked: boolean
  onClick: MouseEventHandler<HTMLDivElement>
}) {
  return (
    <Flex
      onClick={onClick}
      sx={{
        border: '1px solid',
        borderColor: checked ? 'onSuccess' : 'lavender_o25',
        backgroundColor: checked ? 'success' : 'surface',
        width: '20px',
        height: '20px',
        borderRadius: '5px',
        cursor: 'pointer',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {checked && <Icon name="checkmark" color="onSuccess" size="auto" width="12px" />}
    </Flex>
  )
}

export function CookieBanner() {
  const { t } = useTranslation()
  const [showSettings, setShowSettings] = useState(false)
  const [cookieSettings, setCookieSettings]: any = useState({
    functional: true,
    analytics: true,
  })

  return (
    <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 'cookie' }}>
      <Container variant="landingContainer" sx={{ margin: '0 auto', px: 3 }}>
        <Box
          sx={{
            boxShadow: 'fixedBanner',
            bg: 'surface',
            borderRadius: '16px 16px 0 0',
            padding: '24px',
            pb: 3,
          }}
        >
          <Flex sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ maxWidth: '872px', mr: 2 }}>
              <Box sx={{ variant: 'text.paragraph3' }}>
                <Trans
                  i18nKey="landing.cookie-banner.message"
                  components={[
                    <AppLink href="/privacy" sx={{ fontSize: 2, fontWeight: 'body' }} />,
                  ]}
                />
              </Box>
            </Box>
            <Grid
              sx={{
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
                alignItems: 'start',
                minWidth: '200px',
              }}
            >
              <Button variant="bean" sx={{ fontSize: 2 }}>
                {t('landing.cookie-banner.reject')}
              </Button>
              <Button variant="beanActive" sx={{ fontSize: 2 }}>
                {t('landing.cookie-banner.accept')}
              </Button>
            </Grid>
          </Flex>
          <Button
            variant="textual"
            sx={{ fontWeight: 'body', pl: 0 }}
            onClick={() => setShowSettings(!showSettings)}
          >
            {t('landing.cookie-banner.settings-toggle')}
            <ChevronUpDown isUp={showSettings} size={10} sx={{ ml: 2 }} />
          </Button>
          {showSettings && (
            <Grid sx={{ gridTemplateColumns: '12px 1fr' }}>
              {Object.keys(cookieSettings).map((cookieName) => (
                <>
                  <Checkbox
                    key={`${cookieName}-checkbox`}
                    checked={cookieSettings[cookieName]}
                    onClick={() => {
                      setCookieSettings({
                        ...cookieSettings,
                        [cookieName]: !cookieSettings[cookieName],
                      })
                    }}
                  />
                  <Grid key={`${cookieName}-description`}>
                    <Text>{t(`landing.cookie-banner.cookies.${cookieName}.title`)}</Text>
                    <Text>{t(`landing.cookie-banner.cookies.${cookieName}.description`)}</Text>
                  </Grid>
                </>
              ))}
            </Grid>
          )}
        </Box>
      </Container>
    </Box>
  )
}
