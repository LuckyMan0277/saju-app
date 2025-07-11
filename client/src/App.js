
import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Card, Spinner, Form, Button, Row, Col, InputGroup, Container } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import './App.css';

const SAJU_SECTIONS = {
  basic: '기본 성향',
  wealth: '재물운',
  health: '건강운',
  future: '올해의 운세',
};

function App() {
  // User Input State
  const [name, setName] = useState('');
  const [gender, setGender] = useState('male');
  const [calendarType, setCalendarType] = useState('solar');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [hour, setHour] = useState('');
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  
  // Translator State
  const [englishText, setEnglishText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Data State
  const [sajuResults, setSajuResults] = useState({});
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Validate form for button activation
    if (name && year && month && day) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [name, year, month, day]);

  const fetchSajuData = async (section, info) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/get-saju`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...info, section }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '서버 오류');

      setSajuResults(prev => ({ ...prev, [section]: data.sajuResult }));

    } catch (error) {
      console.error(`Error fetching ${section}:`, error);
      setSajuResults(prev => ({ ...prev, [section]: `오류: ${SAJU_SECTIONS[section]} 정보를 받아오지 못했습니다.` }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setInitialLoading(true);
    setActiveTab('basic');
    setSajuResults({});
    const currentUserInfo = { name, gender, calendarType, year, month, day, hour, isLeapMonth };
    setUserInfo(currentUserInfo);

    await fetchSajuData('basic', currentUserInfo);
    setInitialLoading(false);
  };

  const handleTabSelect = (key) => {
    setActiveTab(key);
    if (key === 'translator') return; // Do not fetch saju data for translator tab
    if (!sajuResults[key] && userInfo) {
      fetchSajuData(key, userInfo);
    }
  };

  const handleTranslate = async () => {
    setIsTranslating(true);
    setTranslatedText('');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ englishText }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '번역 서버 오류');

      setTranslatedText(data.translatedText);
    } catch (error) {
      console.error('Error translating text:', error);
      setTranslatedText(`번역 오류: ${error.message}`);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Container className="mt-5" style={{ maxWidth: '500px' }}>
      <Card className="shadow">
        <Card.Body>
          <h1 className="card-title text-center mb-4">🔮 AI 사주팔자 분석 🔮</h1>
          <Form onSubmit={handleInitialSubmit} className="w-100 mx-auto" style={{ maxWidth: '400px' }}>
            <Form.Group className="mb-3" controlId="formName">
              <Form.Label>👤 이름</Form.Label>
              <Form.Control required type="text" placeholder="이름을 입력하세요" value={name} onChange={e => setName(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formGender">
              <Form.Label>🚻 성별</Form.Label>
              <Form.Select value={gender} onChange={e => setGender(e.target.value)}>
                <option value="male">남자</option>
                <option value="female">여자</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formCalendarType">
              <Form.Label>📅 구분</Form.Label>
              <div className="d-flex">
                <Form.Check className="me-3" type="radio" label="양력" name="calendarType" id="solar" value="solar" checked={calendarType === 'solar'} onChange={e => setCalendarType(e.target.value)} />
                <Form.Check type="radio" label="음력" name="calendarType" id="lunar" value="lunar" checked={calendarType === 'lunar'} onChange={e => setCalendarType(e.target.value)} />
                {calendarType === 'lunar' && (
                    <Form.Check className="ms-4" type="checkbox" label="윤달" id="isLeapMonth" checked={isLeapMonth} onChange={e => setIsLeapMonth(e.target.checked)} />
                )}
              </div>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formYear">
              <Form.Label>生 년</Form.Label>
              <Form.Control required type="number" placeholder="태어난 년도 (4자리)" value={year} onChange={e => setYear(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formMonth">
              <Form.Label>月 월</Form.Label>
              <Form.Control required type="number" placeholder="태어난 월" value={month} onChange={e => setMonth(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formDay">
              <Form.Label>日 일</Form.Label>
              <Form.Control required type="number" placeholder="태어난 일" value={day} onChange={e => setDay(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formHour">
              <Form.Label>⏰ 태어난 시간 (선택)</Form.Label>
              <Form.Select value={hour} onChange={e => setHour(e.target.value)}>
                <option value="">시간 모름</option>
                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{`${i}시`}</option>)}
              </Form.Select>
            </Form.Group>

            <div className="d-grid mt-4">
              <Button variant="primary" type="submit" disabled={!isFormValid || initialLoading}>
                {initialLoading ? (
                  <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> 분석 중...</>
                ) : '📿 사주 분석하기 📿'}
              </Button>
            </div>
          </Form>

          {userInfo && !initialLoading && (
            <div className="mt-5">
              <Tabs activeKey={activeTab} onSelect={handleTabSelect} id="saju-tabs" className="mb-3" justify>
                {Object.entries(SAJU_SECTIONS).map(([key, title]) => (
                  <Tab eventKey={key} title={title} key={key}>
                    <Card>
                      <Card.Body style={{ minHeight: '200px' }}>
                        {(isLoading && !sajuResults[key]) ? (
                          <div className="text-center p-5">
                            <Spinner animation="border" role="status" />
                            <p className="mt-2">AI가 열심히 {title}을(를) 분석 중입니다...</p>
                          </div>
                        ) : (
                          <ReactMarkdown>{sajuResults[key] || ''}</ReactMarkdown>
                        )}
                      </Card.Body>
                    </Card>
                  </Tab>
                ))}
                <Tab eventKey="translator" title="번역기">
                  <Card>
                    <Card.Body style={{ minHeight: '200px' }}>
                      <Form.Group className="mb-3">
                        <Form.Label>영어 텍스트 입력</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          placeholder="번역할 영어 텍스트를 입력하세요."
                          value={englishText}
                          onChange={(e) => setEnglishText(e.target.value)}
                        />
                      </Form.Group>
                      <div className="d-grid mb-3">
                        <Button variant="success" onClick={handleTranslate} disabled={isTranslating || !englishText.trim()}>
                          {isTranslating ? (
                            <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> 번역 중...</>
                          ) : '한국어로 번역하기'}
                        </Button>
                      </div>
                      {translatedText && (
                        <div>
                          <h5>번역 결과:</h5>
                          <p>{translatedText}</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Tab>
              </Tabs>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default App;
