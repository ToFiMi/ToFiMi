'use client'

import { Card, Layout, Typography } from 'antd'

const { Content } = Layout
const { Title, Paragraph, Text } = Typography

export default function GDPRPage() {
    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Content style={{ padding: '24px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
                <Card>
                    <Title level={2}>Ochrana osobných údajov (GDPR)</Title>

                    <Paragraph>
                        Táto stránka informuje používateľov o spracovaní ich osobných údajov v súlade s nariadením
                        Európskeho parlamentu a Rady (EÚ) 2016/679 o ochrane fyzických osôb pri spracúvaní osobných
                        údajov a o voľnom pohybe takýchto údajov (GDPR).
                    </Paragraph>

                    <Title level={3}>1. Správca osobných údajov</Title>
                    <Paragraph>
                        Správcom vašich osobných údajov je prevádzkovateľ tejto aplikácie.
                    </Paragraph>

                    <Title level={3}>2. Aké osobné údaje spracúvame</Title>
                    <Paragraph>
                        Pri registrácii a používaní našich služieb spracúvame nasledujúce osobné údaje:
                    </Paragraph>
                    <ul>
                        <li>Meno a priezvisko</li>
                        <li>E-mailová adresa</li>
                        <li>Informácie o účasti na podujatiach</li>
                        <li>Informácie o stravovaní a alergiách</li>
                        <li>Prihlasovacie údaje (zahašované heslo)</li>
                    </ul>

                    <Title level={3}>3. Účel spracúvania osobných údajov</Title>
                    <Paragraph>
                        Vaše osobné údaje spracúvame na nasledujúce účely:
                    </Paragraph>
                    <ul>
                        <li>Zabezpečenie fungovania používateľského účtu</li>
                        <li>Správa registrácií na podujatia</li>
                        <li>Organizácia stravovania a zohľadnenie alergií</li>
                        <li>Komunikácia s používateľmi</li>
                        <li>Vedenie evidencie účasti</li>
                    </ul>

                    <Title level={3}>4. Právny základ spracúvania</Title>
                    <Paragraph>
                        Právnym základom spracúvania vašich osobných údajov je:
                    </Paragraph>
                    <ul>
                        <li>Váš súhlas so spracúvaním osobných údajov (čl. 6 ods. 1 písm. a) GDPR)</li>
                        <li>Plnenie zmluvy a poskytovanie služieb (čl. 6 ods. 1 písm. b) GDPR)</li>
                    </ul>

                    <Title level={3}>5. Doba uchovávania údajov</Title>
                    <Paragraph>
                        Vaše osobné údaje uchovávame po dobu:
                    </Paragraph>
                    <ul>
                        <li>Po dobu trvania používateľského účtu</li>
                        <li>Po deaktivácii účtu môžu byť údaje archivované v súlade s právnymi predpismi</li>
                    </ul>

                    <Title level={3}>6. Príjemcovia osobných údajov</Title>
                    <Paragraph>
                        Vaše osobné údaje môžu byť sprístupnené:
                    </Paragraph>
                    <ul>
                        <li>Vedúcim a animátorom vo vašej škole/skupine</li>
                        <li>Administrátorom systému</li>
                        <li>Poskytovateľom technických služieb (hosting)</li>
                    </ul>

                    <Title level={3}>7. Vaše práva</Title>
                    <Paragraph>
                        V súvislosti so spracúvaním osobných údajov máte nasledujúce práva:
                    </Paragraph>
                    <ul>
                        <li><Text strong>Právo na prístup</Text> - máte právo získať informácie o spracúvaní vašich osobných údajov</li>
                        <li><Text strong>Právo na opravu</Text> - máte právo na opravu nesprávnych osobných údajov</li>
                        <li><Text strong>Právo na výmaz</Text> - máte právo požiadať o vymazanie vašich osobných údajov</li>
                        <li><Text strong>Právo na obmedzenie spracúvania</Text> - máte právo obmedziť spracúvanie vašich údajov</li>
                        <li><Text strong>Právo na prenosnosť</Text> - máte právo získať vaše údaje v strojovo čitateľnom formáte</li>
                        <li><Text strong>Právo odvolať súhlas</Text> - máte právo kedykoľvek odvolať váš súhlas so spracúvaním</li>
                        <li><Text strong>Právo podať sťažnosť</Text> - máte právo podať sťažnosť na Úrad na ochranu osobných údajov SR</li>
                    </ul>

                    <Title level={3}>8. Bezpečnosť údajov</Title>
                    <Paragraph>
                        Vaše osobné údaje chránime pomocou technických a organizačných opatrení vrátane:
                    </Paragraph>
                    <ul>
                        <li>Šifrovania hesiel</li>
                        <li>Zabezpečeného prístupu k databázam</li>
                        <li>Pravidelných bezpečnostných aktualizácií</li>
                        <li>Obmedzeného prístupu k údajom len oprávneným osobám</li>
                    </ul>

                    <Title level={3}>9. Kontakt</Title>
                    <Paragraph>
                        Ak máte akékoľvek otázky týkajúce sa ochrany osobných údajov alebo chcete uplatniť svoje práva,
                        kontaktujte nás na e-mailovej adrese správcu systému.
                    </Paragraph>

                    <Paragraph type="secondary" style={{ marginTop: 32 }}>
                        Posledná aktualizácia: {new Date().toLocaleDateString('sk-SK')}
                    </Paragraph>
                </Card>
            </Content>
        </Layout>
    )
}