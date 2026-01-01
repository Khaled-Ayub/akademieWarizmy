/**
 * AI Assistant - Hauptseite
 * 
 * Zeigt eine Oberfläche mit drei Tabs:
 * 1. Generieren - Text mit KI generieren
 * 2. Verbessern - Bestehenden Text verbessern
 * 3. Übersetzen - Text in andere Sprachen übersetzen
 */
import React, { useState } from 'react';
import {
  Layout,
  HeaderLayout,
  ContentLayout,
  Box,
  Tabs,
  Tab,
  TabGroup,
  TabPanels,
  TabPanel,
  Typography,
  Textarea,
  Button,
  Select,
  Option,
  Flex,
  Loader,
  Alert,
  IconButton,
} from '@strapi/design-system';
import { Duplicate, Spark, Refresh, Globe } from '@strapi/icons';
import pluginId from '../../pluginId';

const HomePage = () => {
  // ===== STATE =====
  // Generieren Tab
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generateType, setGenerateType] = useState('general');
  const [generateLanguage, setGenerateLanguage] = useState('de');
  const [generateResult, setGenerateResult] = useState('');
  const [generateLoading, setGenerateLoading] = useState(false);

  // Verbessern Tab
  const [improveText, setImproveText] = useState('');
  const [improveInstruction, setImproveInstruction] = useState('');
  const [improveResult, setImproveResult] = useState('');
  const [improveLoading, setImproveLoading] = useState(false);

  // Übersetzen Tab
  const [translateText, setTranslateText] = useState('');
  const [translateLanguage, setTranslateLanguage] = useState('en');
  const [translateResult, setTranslateResult] = useState('');
  const [translateLoading, setTranslateLoading] = useState(false);

  // Allgemein
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // ===== API CALLS =====
  
  /**
   * Text generieren
   */
  const handleGenerate = async () => {
    if (!generatePrompt.trim()) {
      setError('Bitte gib einen Prompt ein');
      return;
    }

    setGenerateLoading(true);
    setError('');
    setGenerateResult('');

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: generatePrompt,
          type: generateType,
          language: generateLanguage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGenerateResult(data.text);
      } else {
        setError(data.error?.message || 'Fehler bei der Generierung');
      }
    } catch (err) {
      setError('Verbindungsfehler: ' + err.message);
    } finally {
      setGenerateLoading(false);
    }
  };

  /**
   * Text verbessern
   */
  const handleImprove = async () => {
    if (!improveText.trim()) {
      setError('Bitte gib einen Text ein');
      return;
    }

    setImproveLoading(true);
    setError('');
    setImproveResult('');

    try {
      const response = await fetch('/api/ai/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: improveText,
          instruction: improveInstruction || 'Verbessere diesen Text',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setImproveResult(data.text);
      } else {
        setError(data.error?.message || 'Fehler bei der Verbesserung');
      }
    } catch (err) {
      setError('Verbindungsfehler: ' + err.message);
    } finally {
      setImproveLoading(false);
    }
  };

  /**
   * Text übersetzen
   */
  const handleTranslate = async () => {
    if (!translateText.trim()) {
      setError('Bitte gib einen Text ein');
      return;
    }

    setTranslateLoading(true);
    setError('');
    setTranslateResult('');

    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: translateText,
          targetLanguage: translateLanguage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTranslateResult(data.text);
      } else {
        setError(data.error?.message || 'Fehler bei der Übersetzung');
      }
    } catch (err) {
      setError('Verbindungsfehler: ' + err.message);
    } finally {
      setTranslateLoading(false);
    }
  };

  /**
   * Text in Zwischenablage kopieren
   */
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ===== RENDER =====
  return (
    <Layout>
      {/* Header */}
      <HeaderLayout
        title="AI Assistent"
        subtitle="Nutze KI um Texte zu generieren, verbessern und übersetzen"
        primaryAction={
          <Button startIcon={<Spark />} disabled>
            GPT-4o-mini
          </Button>
        }
      />

      <ContentLayout>
        {/* Fehlermeldung */}
        {error && (
          <Box paddingBottom={4}>
            <Alert
              closeLabel="Schließen"
              title="Fehler"
              variant="danger"
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          </Box>
        )}

        {/* Erfolgsmeldung beim Kopieren */}
        {copied && (
          <Box paddingBottom={4}>
            <Alert title="Kopiert!" variant="success">
              Text wurde in die Zwischenablage kopiert
            </Alert>
          </Box>
        )}

        {/* Tabs */}
        <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
          <TabGroup label="AI Funktionen" id="ai-tabs">
            <Tabs>
              <Tab>
                <Spark /> Generieren
              </Tab>
              <Tab>
                <Refresh /> Verbessern
              </Tab>
              <Tab>
                <Globe /> Übersetzen
              </Tab>
            </Tabs>

            <TabPanels>
              {/* ===== TAB 1: GENERIEREN ===== */}
              <TabPanel>
                <Box paddingTop={4}>
                  <Flex direction="column" gap={4}>
                    {/* Typ-Auswahl */}
                    <Select
                      label="Inhaltstyp"
                      hint="Wähle den Typ des zu generierenden Texts"
                      value={generateType}
                      onChange={setGenerateType}
                    >
                      <Option value="general">Allgemein</Option>
                      <Option value="course_description">Kursbeschreibung</Option>
                      <Option value="lesson_content">Lektionsinhalt</Option>
                      <Option value="faq_answer">FAQ-Antwort</Option>
                    </Select>

                    {/* Sprache */}
                    <Select
                      label="Sprache"
                      hint="In welcher Sprache soll der Text sein?"
                      value={generateLanguage}
                      onChange={setGenerateLanguage}
                    >
                      <Option value="de">Deutsch</Option>
                      <Option value="en">Englisch</Option>
                      <Option value="ar">Arabisch</Option>
                      <Option value="tr">Türkisch</Option>
                      <Option value="fr">Französisch</Option>
                    </Select>

                    {/* Prompt */}
                    <Textarea
                      label="Prompt"
                      placeholder="Beschreibe was du generieren möchtest, z.B. 'Erstelle eine Kursbeschreibung für einen Python-Einsteigerkurs'"
                      hint="Je detaillierter dein Prompt, desto besser das Ergebnis"
                      value={generatePrompt}
                      onChange={(e) => setGeneratePrompt(e.target.value)}
                      style={{ minHeight: '120px' }}
                    />

                    {/* Button */}
                    <Button
                      startIcon={generateLoading ? <Loader small /> : <Spark />}
                      onClick={handleGenerate}
                      disabled={generateLoading || !generatePrompt.trim()}
                      fullWidth
                    >
                      {generateLoading ? 'Generiere...' : 'Text generieren'}
                    </Button>

                    {/* Ergebnis */}
                    {generateResult && (
                      <Box
                        background="neutral100"
                        padding={4}
                        hasRadius
                        borderColor="neutral200"
                        borderStyle="solid"
                        borderWidth="1px"
                      >
                        <Flex justifyContent="space-between" alignItems="start">
                          <Typography variant="omega" fontWeight="bold">
                            Generierter Text:
                          </Typography>
                          <IconButton
                            onClick={() => copyToClipboard(generateResult)}
                            label="Kopieren"
                            icon={<Duplicate />}
                          />
                        </Flex>
                        <Box paddingTop={2}>
                          <Typography variant="omega" style={{ whiteSpace: 'pre-wrap' }}>
                            {generateResult}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Flex>
                </Box>
              </TabPanel>

              {/* ===== TAB 2: VERBESSERN ===== */}
              <TabPanel>
                <Box paddingTop={4}>
                  <Flex direction="column" gap={4}>
                    {/* Originaltext */}
                    <Textarea
                      label="Originaltext"
                      placeholder="Füge hier den Text ein, den du verbessern möchtest"
                      hint="Der Text wird hinsichtlich Grammatik, Stil und Klarheit verbessert"
                      value={improveText}
                      onChange={(e) => setImproveText(e.target.value)}
                      style={{ minHeight: '120px' }}
                    />

                    {/* Anweisung */}
                    <Textarea
                      label="Anweisung (optional)"
                      placeholder="z.B. 'Mache den Text formeller' oder 'Kürze den Text'"
                      hint="Spezifische Anweisungen für die Verbesserung"
                      value={improveInstruction}
                      onChange={(e) => setImproveInstruction(e.target.value)}
                    />

                    {/* Button */}
                    <Button
                      startIcon={improveLoading ? <Loader small /> : <Refresh />}
                      onClick={handleImprove}
                      disabled={improveLoading || !improveText.trim()}
                      fullWidth
                    >
                      {improveLoading ? 'Verbessere...' : 'Text verbessern'}
                    </Button>

                    {/* Ergebnis */}
                    {improveResult && (
                      <Box
                        background="neutral100"
                        padding={4}
                        hasRadius
                        borderColor="neutral200"
                        borderStyle="solid"
                        borderWidth="1px"
                      >
                        <Flex justifyContent="space-between" alignItems="start">
                          <Typography variant="omega" fontWeight="bold">
                            Verbesserter Text:
                          </Typography>
                          <IconButton
                            onClick={() => copyToClipboard(improveResult)}
                            label="Kopieren"
                            icon={<Duplicate />}
                          />
                        </Flex>
                        <Box paddingTop={2}>
                          <Typography variant="omega" style={{ whiteSpace: 'pre-wrap' }}>
                            {improveResult}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Flex>
                </Box>
              </TabPanel>

              {/* ===== TAB 3: ÜBERSETZEN ===== */}
              <TabPanel>
                <Box paddingTop={4}>
                  <Flex direction="column" gap={4}>
                    {/* Zielsprache */}
                    <Select
                      label="Zielsprache"
                      hint="In welche Sprache soll übersetzt werden?"
                      value={translateLanguage}
                      onChange={setTranslateLanguage}
                    >
                      <Option value="de">Deutsch</Option>
                      <Option value="en">Englisch</Option>
                      <Option value="ar">Arabisch</Option>
                      <Option value="tr">Türkisch</Option>
                      <Option value="fr">Französisch</Option>
                    </Select>

                    {/* Originaltext */}
                    <Textarea
                      label="Text zum Übersetzen"
                      placeholder="Füge hier den Text ein, den du übersetzen möchtest"
                      hint="Der Text wird in die gewählte Zielsprache übersetzt"
                      value={translateText}
                      onChange={(e) => setTranslateText(e.target.value)}
                      style={{ minHeight: '120px' }}
                    />

                    {/* Button */}
                    <Button
                      startIcon={translateLoading ? <Loader small /> : <Globe />}
                      onClick={handleTranslate}
                      disabled={translateLoading || !translateText.trim()}
                      fullWidth
                    >
                      {translateLoading ? 'Übersetze...' : 'Text übersetzen'}
                    </Button>

                    {/* Ergebnis */}
                    {translateResult && (
                      <Box
                        background="neutral100"
                        padding={4}
                        hasRadius
                        borderColor="neutral200"
                        borderStyle="solid"
                        borderWidth="1px"
                      >
                        <Flex justifyContent="space-between" alignItems="start">
                          <Typography variant="omega" fontWeight="bold">
                            Übersetzung:
                          </Typography>
                          <IconButton
                            onClick={() => copyToClipboard(translateResult)}
                            label="Kopieren"
                            icon={<Duplicate />}
                          />
                        </Flex>
                        <Box paddingTop={2}>
                          <Typography variant="omega" style={{ whiteSpace: 'pre-wrap' }}>
                            {translateResult}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Flex>
                </Box>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </Box>
      </ContentLayout>
    </Layout>
  );
};

export default HomePage;

