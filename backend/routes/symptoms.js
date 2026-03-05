const express = require('express');
const router = express.Router();
const controller = require('../controllers/symptomController');
const auth = require('../middleware/auth');

// Comprehensive symptom analysis endpoint
router.post('/analyze', (req, res) => {
  const { symptoms } = req.body;
  
  if (!symptoms || typeof symptoms !== 'string') {
    return res.status(400).json({ error: 'Symptoms text is required' });
  }

  const lowerSymptoms = symptoms.toLowerCase();
  const conditions = [];
  const recommendations = [];
  let severity = 'Low';
  let urgency = 'Non-urgent';

// Comprehensive symptom analysis engine with 40+ symptoms
  const symptomKeywords = {
    'fever': { condition: 'Fever/Infection', severity: 'Medium', urgency: 'Consult doctor if >103°F (39.4°C)', treatment: 'Rest, fluids, acetaminophen/ibuprofen (not aspirin for children)', tests: ['Temperature check', 'CBC', 'Blood culture if >39°C'] },
    'headache': { condition: 'Headache/Migraine', severity: 'Low', urgency: 'Monitor; consult if persistent (>3 days)', treatment: 'Rest, dark room, OTC pain relief, stay hydrated', tests: ['Check for fever, stiff neck, vision changes'] },
    'cough': { condition: 'Respiratory Infection/Bronchitis', severity: 'Medium', urgency: 'Monitor symptoms; seek help if worsens', treatment: 'Honey, expectorants, humidifier, avoid irritants', tests: ['Chest X-ray if persistent', 'COVID/Flu test'] },
    'sore throat': { condition: 'Pharyngitis/Strep Throat', severity: 'Medium', urgency: 'Throat swab test recommended within 48hr', treatment: 'Warm salt gargles, lozenges, pain relief, antibiotics if strep+', tests: ['Rapid strep test', 'Throat culture'] },
    'chest pain': { condition: 'Chest Discomfort - CARDIAC ALERT', severity: 'High', urgency: 'URGENT - Call 911 immediately', treatment: 'Do not drive alone; seek ER immediately', tests: ['EKG', 'Troponin', 'Chest X-ray', 'Blood pressure check'] },
    'shortness of breath': { condition: 'Dyspnea/Respiratory Distress', severity: 'High', urgency: 'URGENT - Go to ER if severe', treatment: 'Sit upright, oxygen if available, emergency care', tests: ['Pulse oximetry', 'Chest X-ray', 'EKG', 'ABG if severe'] },
    'fatigue': { condition: 'Fatigue/Exhaustion', severity: 'Low', urgency: 'Rest and hydration recommended; monitor', treatment: 'Sleep 8+ hours, balanced nutrition, light exercise', tests: ['CBC, TSH, glucose test'] },
    'nausea': { condition: 'Nausea/Gastrointestinal', severity: 'Low-Medium', urgency: 'Monitor diet; hydrate; avoid triggers', treatment: 'Small frequent meals, ginger tea, antiemetics if needed', tests: ['Check for dehydration, pregnancy test if applicable'] },
    'vomiting': { condition: 'Gastroenteritis/Food Poisoning', severity: 'Medium', urgency: 'Dehydration risk; seek help if >4hrs', treatment: 'NPO initially, then clear fluids, electrolyte solutions', tests: ['Stool culture if bloody', 'Dehydration assessment'] },
    'diarrhea': { condition: 'Gastroenteritis/Food Poisoning', severity: 'Low-Medium', urgency: 'Hydration crucial; see doctor if >7 days', treatment: 'Electrolyte solutions, bland diet, probiotics', tests: ['Stool culture/antigen if severe', 'Dehydration check'] },
    'dizziness': { condition: 'Vertigo/Dizziness/BPPV', severity: 'Low-Medium', urgency: 'Avoid driving; stay seated', treatment: 'Head position maneuvers, antihistamines, physical therapy', tests: ['Dix-Hallpike test', 'Imaging if persistent'] },
    'rash': { condition: 'Dermatitis/Allergic Reaction', severity: 'Low-Medium', urgency: 'Monitor for spread; seek help if worsens', treatment: 'Antihistamines, topical steroids, identify trigger', tests: ['Allergy testing, skin biopsy if needed'] },
    'joint pain': { condition: 'Arthralgia/Arthritis/Joint Inflammation', severity: 'Low-Medium', urgency: 'Physical therapy recommended', treatment: 'RICE protocol, NSAIDs, physical therapy', tests: ['Joint X-ray, rheumatoid factor, ESR'] },
    'back pain': { condition: 'Dorsalgia/Muscle Strain/Disc Issues', severity: 'Low-Medium', urgency: 'Physical therapy; spine imaging if neurologic signs', treatment: 'Rest, physical therapy, NSAIDs, ergonomic setup', tests: ['MRI/CT if severe or neurologic symptoms', 'EMG if radiating'] },
    'abdominal pain': { condition: 'Abdominal Discomfort - Multiple Possible Causes', severity: 'Medium', urgency: 'Medical evaluation recommended; ER if severe', treatment: 'NPO, baseline labs, imaging may be needed', tests: ['Abdominal ultrasound/CT', 'Amylase/Lipase', 'Liver function tests'] },
    'anxiety': { condition: 'Anxiety Disorder/Panic Attack', severity: 'Low-Medium', urgency: 'Mental health support recommended', treatment: '4-7-8 breathing, CBT, meditation, SSRIs if persistent', tests: ['Rule out thyroid dysfunction, cardiac causes'] },
    'insomnia': { condition: 'Sleep Disorder/Insomnia', severity: 'Low', urgency: 'Sleep hygiene; cognitive therapy recommended', treatment: 'Sleep schedule, avoid screens 1hr before bed, melatonin', tests: ['Sleep study if severe (polysomnography)'] },
    'bruising': { condition: 'Contusion/Bleeding Disorder Risk', severity: 'Low-Medium', urgency: 'Monitor; seek help if extensive or unexplained', treatment: 'RICE protocol, compression, elevation', tests: ['PT/INR, platelet count if spontaneous'] },
    'muscle pain': { condition: 'Myalgia/Muscle Strain', severity: 'Low-Medium', urgency: 'Rest and recovery recommended', treatment: 'Stretching, massage, heat therapy, NSAIDs', tests: ['CK level if extensive', 'EMG if weakness present'] },
    'leg pain': { condition: 'Leg Pain/Muscle Strain/Neural Issues/DVT Risk', severity: 'Low-Medium', urgency: 'Monitor; seek help if severe swelling, warmth, or chest pain', treatment: 'Rest, elevation, compression, NSAIDs, pain relief', tests: ['Doppler ultrasound if swelling', 'Nerve conduction study if radiating'] },
    'arm pain': { condition: 'Arm Pain/Nerve Compression/Muscle Strain', severity: 'Low-Medium', urgency: 'Rest and observe; seek help if numbness/weakness develops', treatment: 'Rest, ice, compression, NSAIDs, physical therapy', tests: ['MRI if radiculopathy suspected', 'EMG for nerve damage'] },
    'neck pain': { condition: 'Cervical Pain/Muscle Strain/Disc Issues', severity: 'Low-Medium', urgency: 'Avoid sudden movements; physical therapy if persistent', treatment: 'Heat therapy, NSAIDs, neck stretches, ergonomic support', tests: ['Cervical X-ray or MRI if neurologic signs', 'EMG if radiating'] },
    'shoulder pain': { condition: 'Shoulder Pain/Rotator Cuff/Bursitis', severity: 'Low-Medium', urgency: 'Monitor; physical therapy recommended', treatment: 'Rest, ice, compression, NSAIDs, physical therapy', tests: ['Shoulder X-ray or ultrasound', 'MRI if rotator cuff tear suspected'] },
    'knee pain': { condition: 'Knee Pain/Ligament Injury/Arthritis', severity: 'Low-Medium', urgency: 'Rest and ice; avoid weight bearing if severe', treatment: 'RICE protocol, NSAIDs, physical therapy, bracing', tests: ['Knee X-ray, MRI if ligament injury suspected', 'Arthrocentesis if joint effusion'] },
    'foot pain': { condition: 'Foot Pain/Plantar Fasciitis/Neuropathy', severity: 'Low', urgency: 'Rest and proper footwear; see podiatrist if persistent', treatment: 'Plantar fascia stretches, ice, night splint, orthotic inserts', tests: ['Foot X-ray, ultrasound if inflammation', 'Nerve conduction study if neuropathy'] },
    'wrist pain': { condition: 'Wrist Pain/Carpal Tunnel/Fracture Risk', severity: 'Low-Medium', urgency: 'Immobilize if swelling; seek help if unable to move', treatment: 'Immobilization, rest, ice, NSAIDs, physical therapy', tests: ['Wrist X-ray to rule out fracture', 'EMG for carpal tunnel syndrome'] },
    'hand pain': { condition: 'Hand Pain/Joint Issues/Neuropathy', severity: 'Low', urgency: 'Monitor; seek help if numbness or weakness develops', treatment: 'Rest, ice, NSAIDs, hand exercises, occupational therapy', tests: ['Hand X-ray if injury', 'Nerve conduction studies if neuropathy'] },
    'hip pain': { condition: 'Hip Pain/Bursitis/Osteoarthritis', severity: 'Low-Medium', urgency: 'Rest and avoid hip flexion movements', treatment: 'Rest, ice, NSAIDs, physical therapy, weight management', tests: ['Hip X-ray, MRI if labral tear suspected', 'ESR/CRP if inflammatory'] },
    'sinus congestion': { condition: 'Sinusitis/Rhinitis/Allergies', severity: 'Low', urgency: 'Monitor; see ENT if >10 days', treatment: 'Saline rinse, decongestants, steam inhaler', tests: ['Nasal endoscopy if chronic', 'Allergy testing'] },
    'ear pain': { condition: 'Otitis Media/Otitis Externa', severity: 'Low-Medium', urgency: 'See doctor within 24hrs', treatment: 'Warm compress, pain relief, antibiotics if bacterial', tests: ['Otoscopy, tympanometry'] },
    'sore eyes': { condition: 'Conjunctivitis/Dry Eye/Uveitis', severity: 'Low-Medium', urgency: 'Avoid contact lenses; see optometrist if no improvement', treatment: 'Lubricating drops, warm compress, topical antibiotics if bacterial', tests: ['Eye exam, fluorescein stain test'] },
    'persistent cough': { condition: 'Chronic Bronchitis/Post-viral Cough/GERD', severity: 'Medium', urgency: 'Investigate if >3 weeks; rule out TB', treatment: 'Cough suppressants, address underlying cause', tests: ['Chest X-ray, PFTs', 'Tuberculosis screening'] },
    'loss of appetite': { condition: 'Anorexia/Infection/Depression', severity: 'Low-Medium', urgency: 'Monitor weight; seek help if >10% weight loss', treatment: 'Nutritional assessment, address underlying cause', tests: ['CBC, metabolic panel, TSH'] },
    'weight loss': { condition: 'Unintentional Weight Loss - Rule Out Serious Causes', severity: 'Medium', urgency: 'Medical evaluation needed if unexplained', treatment: 'Investigate thyroid, diabetes, malignancy risk', tests: ['Comprehensive metabolic panel, TSH, cancer screening'] },
    'swollen lymph nodes': { condition: 'Lymphadenopathy/Infection/Malignancy Risk', severity: 'Medium', urgency: 'Biopsy if >6 weeks, hard, or fixed', treatment: 'Monitor, address underlying infection', tests: ['Lymph node biopsy if persistent', 'Ultrasound', 'Infectious disease workup'] },
    'night sweats': { condition: 'Night Sweats/Infection/Lymphoma Risk', severity: 'Medium', urgency: 'See doctor if persistent >2 weeks', treatment: 'Light bedding, identify trigger, address cause', tests: ['Tuberculosis test (TB-Gold)', 'CBC', 'Lymph node imaging'] },
    'tremor': { condition: 'Tremor/Parkinson\'s/Hyperthyroidism', severity: 'Low-Medium', urgency: 'Neurologic evaluation recommended', treatment: 'Address underlying cause, beta-blockers if needed', tests: ['Thyroid function, imaging, neurologic exam'] },
    'memory loss': { condition: 'Cognitive Decline/Dementia Risk/Medication Side Effect', severity: 'Medium', urgency: 'Neuropsych evaluation if rapid onset', treatment: 'Address reversible causes, cognitive rehabilitation', tests: ['Cognitive testing, MRI/CT', 'Vitamin B12, thyroid levels'] },
    'depression': { condition: 'Major Depressive Disorder/Mood Disorder', severity: 'Medium', urgency: 'Mental health referral strongly recommended', treatment: 'Psychotherapy, SSRIs, lifestyle changes', tests: ['PHQ-9 screening', 'Thyroid, vitamin D levels'] },
    'bleeding': { condition: 'Hemorrhage/Coagulation Disorder', severity: 'High', urgency: 'URGENT - Seek ER immediately', treatment: 'Direct pressure, IV access, blood products', tests: ['CBC, coagulation panel, type & cross'] },
    'confusion': { condition: 'Delirium/Stroke/Metabolic Issue - MEDICAL EMERGENCY', severity: 'High', urgency: 'URGENT - Call 911 immediately', treatment: 'ER evaluation for stroke/sepsis/hypoglycemia', tests: ['CT/MRI head', 'Metabolic panel', 'Blood glucose', 'EKG'] },
    'difficulty breathing at rest': { condition: 'Severe Respiratory Distress - EMERGENCY', severity: 'High', urgency: 'URGENT - Call 911, use inhaler if available', treatment: 'Oxygen, emergency airway management', tests: ['Urgent: Chest X-ray, ABG, EKG'] },
    'difficulty swallowing': { condition: 'Dysphagia/Pharyngeal/Esophageal Issue', severity: 'Medium', urgency: 'ENT/GI evaluation recommended', treatment: 'Swallow study, dietary modifications, address cause', tests: ['Barium swallow, endoscopy if indicated'] },
    'blood in urine': { condition: 'Hematuria/Kidney/Bladder Issue', severity: 'Medium', urgency: 'Urology referral recommended', treatment: 'Increased hydration, identify cause', tests: ['Urinalysis, ultrasound, cystoscopy'] },
    'blood in stool': { condition: 'Hematochezia/GI Bleeding', severity: 'Medium-High', urgency: 'GI evaluation strongly recommended; ER if large volume', treatment: 'NPO, IV access, transfusion if needed', tests: ['Colonoscopy, CBC', 'Coagulation studies'] },
  };

  // Enhanced health advice database
  const healthAdviceDB = {
    infection: [
      'Stay isolated to prevent spreading to others',
      'Use separate towels and eating utensils',
      'Drink fluid with electrolytes (coconut water, sports drinks)',
      'Take vitamin C (citrus, berries) to support immunity',
      'Avoid alcohol and smoking which suppress immunity'
    ],
    respiratory: [
      'Use a humidifier or steam shower to ease congestion',
      'Elevate head while sleeping to ease breathing',
      'Avoid irritants (smoke, pollution, strong odors)',
      'Stay hydrated - warm tea with honey is beneficial',
      'Consider saline nasal rinse or sprays'
    ],
    gastrointestinal: [
      'Follow "BRAT" diet: Banana, Rice, Applesauce, Toast',
      'Avoid dairy, fatty foods, spicy foods temporarily',
      'Sip clear fluids frequently (water, broth, coconut water)',
      'Probiotics may help restore gut flora',
      'Avoid dehydration - it\'s the main complication'
    ],
    pain: [
      'Apply heat for muscle pain (shower, heating pad)',
      'Apply cold for acute injuries and swelling',
      'Gentle stretching and movement when tolerated',
      'Consider NSAIDs like ibuprofen for inflammation',
      'Physical therapy can address chronic pain'
    ],
    mental: [
      'Practice deep breathing: Inhale 4sec, hold 4sec, exhale 4sec',
      'Spend time in nature or with loved ones',
      'Regular exercise releases endorphins and improves mood',
      'Maintain consistent sleep schedule (critical for mood)',
      'Limit caffeine and alcohol which worsen anxiety'
    ]
  };

  // Create comprehensive keyword mapping with all variations and synonyms
  const symptomAliases = {
    'fever': ['fever', 'fevers', 'feverish', 'high temperature', 'temp', 'elevated temp', 'hot'],
    'headache': ['headache', 'headaches', 'head pain', 'head ache', 'migraine', 'migraines', 'head hurts'],
    'cough': ['cough', 'coughs', 'coughing', 'cough up', 'coughed', 'persistent cough', 'dry cough', 'wet cough'],
    'sore throat': ['sore throat', 'sore throat', 'throat pain', 'throat hurts', 'throat ache', 'pharyngitis', 'strep'],
    'chest pain': ['chest pain', 'chest ache', 'chest discomfort', 'chest hurts', 'pain in chest'],
    'shortness of breath': ['shortness of breath', 'short of breath', 'short breath', 'breathless', 'hard to breath', 'hard to breathe', 'breathing difficulty', 'cant breathe', 'dyspnea'],
    'fatigue': ['fatigue', 'tired', 'exhausted', 'exhaustion', 'fatigued', 'very tired', 'worn out', 'sleepy'],
    'nausea': ['nausea', 'nauseous', 'feel sick', 'feeling sick', 'queasy', 'sick feeling', 'upset stomach'],
    'vomiting': ['vomiting', 'vomit', 'throwing up', 'throw up', 'puke', 'puking', 'sick'],
    'diarrhea': ['diarrhea', 'diarrhoea', 'loose stools', 'loose stool', 'runs', 'the runs', 'stomach upset'],
    'dizziness': ['dizziness', 'dizzy', 'vertigo', 'lightheaded', 'light headed', 'spinning', 'head spinning'],
    'rash': ['rash', 'rashes', 'skin rash', 'hives', 'itchy skin', 'skin irritation', 'skin reaction'],
    'joint pain': ['joint pain', 'joint ache', 'joint hurts', 'achy joints', 'arthritis', 'joints hurt'],
    'back pain': ['back pain', 'back ache', 'backache', 'lower back pain', 'upper back pain', 'back hurts', 'sore back'],
    'abdominal pain': ['abdominal pain', 'stomach pain', 'stomach ache', 'belly pain', 'belly hurts', 'stomach hurts', 'gut pain', 'abdomen pain'],
    'anxiety': ['anxiety', 'anxious', 'anxiousness', 'panic', 'panic attack', 'panic disorder', 'worried', 'nervousness', 'nervous'],
    'insomnia': ['insomnia', 'insomnic', 'cant sleep', 'cannot sleep', 'unable to sleep', 'sleep problem', 'sleeplessness', 'no sleep'],
    'bruising': ['bruise', 'bruises', 'bruising', 'bruised', 'black and blue', 'discoloration'],
    'muscle pain': ['muscle pain', 'muscle ache', 'muscle aches', 'myalgia', 'sore muscles', 'muscles hurt', 'muscular pain'],
    'leg pain': ['leg pain', 'leg ache', 'leg hurts', 'sore leg', 'pain in leg', 'calf pain', 'thigh pain', 'shin pain', 'leg cramp'],
    'arm pain': ['arm pain', 'arm ache', 'arm hurts', 'sore arm', 'pain in arm', 'upper arm pain', 'forearm pain'],
    'neck pain': ['neck pain', 'neck ache', 'neck hurts', 'sore neck', 'pain in neck', 'stiff neck', 'neck stiffness'],
    'shoulder pain': ['shoulder pain', 'shoulder ache', 'shoulder hurts', 'sore shoulder', 'pain in shoulder', 'shoulder discomfort'],
    'knee pain': ['knee pain', 'knee ache', 'knee hurts', 'sore knee', 'pain in knee', 'knee swelling'],
    'foot pain': ['foot pain', 'foot ache', 'foot hurts', 'sore foot', 'pain in foot', 'heel pain', 'arch pain', 'sole pain'],
    'wrist pain': ['wrist pain', 'wrist ache', 'wrist hurts', 'sore wrist', 'pain in wrist', 'carpal tunnel'],
    'hand pain': ['hand pain', 'hand ache', 'hand hurts', 'sore hand', 'pain in hand', 'finger pain', 'fingers hurt'],
    'hip pain': ['hip pain', 'hip ache', 'hip hurts', 'sore hip', 'pain in hip', 'hip discomfort'],
    'sinus congestion': ['sinus congestion', 'congestion', 'stuffy nose', 'nasal congestion', 'sinus', 'stuffy'],
    'ear pain': ['ear pain', 'ear ache', 'earache', 'ear hurts', 'ear discomfort', 'otitis'],
    'sore eyes': ['sore eyes', 'eye pain', 'eye ache', 'eyes hurt', 'painful eyes', 'conjunctivitis'],
    'persistence cough': ['persistent cough', 'chronic cough', 'long cough', 'lingering cough'],
    'loss of appetite': ['loss of appetite', 'no appetite', 'dont want to eat', 'anorexia', 'appetite loss'],
    'weight loss': ['weight loss', 'weight decrease', 'losing weight', 'weight drop', 'weight down'],
    'swollen lymph nodes': ['swollen lymph nodes', 'swollen nodes', 'lymph node swelling', 'enlarged lymph nodes', 'node swelling'],
    'night sweats': ['night sweats', 'night sweat', 'sweating at night', 'cold sweats', 'sweats'],
    'tremor': ['tremor', 'tremors', 'shaking', 'shakes', 'trembling', 'trembles', 'hands shaking'],
    'memory loss': ['memory loss', 'forgetfulness', 'forgot', 'memory problems', 'cant remember', 'cognitive decline'],
    'depression': ['depression', 'depressed', 'depressing', 'sad', 'sadness', 'mood disorder', 'mood down'],
    'bleeding': ['bleeding', 'bleeds', 'bloody', 'blood', 'hemorrhage', 'hemorrhaging', 'bleed'],
    'confusion': ['confusion', 'confused', 'confusing', 'disoriented', 'disorientation', 'cant think'],
    'difficulty breathing at rest': ['difficulty breathing', 'trouble breathing', 'breathing problems', 'cant catch breath', 'respiratory distress'],
    'difficulty swallowing': ['difficulty swallowing', 'trouble swallowing', 'hard to swallow', 'swallowing problem', 'dysphagia'],
    'blood in urine': ['blood in urine', 'bloody urine', 'hematuria', 'urine blood'],
    'blood in stool': ['blood in stool', 'bloody stool', 'stool blood', 'hematochezia']
  };

  // Create reverse mapping for faster lookups
  const keywordToSymptom = {};
  for (const [symptom, aliases] of Object.entries(symptomAliases)) {
    aliases.forEach(alias => {
      keywordToSymptom[alias.toLowerCase()] = symptom;
    });
  }

  // Smart body part detection - combines body parts with pain indicators
  const bodyPartMap = {
    'leg': 'leg pain',
    'legs': 'leg pain',
    'arm': 'arm pain',
    'arms': 'arm pain',
    'neck': 'neck pain',
    'shoulder': 'shoulder pain',
    'shoulders': 'shoulder pain',
    'knee': 'knee pain',
    'knees': 'knee pain',
    'foot': 'foot pain',
    'feet': 'foot pain',
    'wrist': 'wrist pain',
    'wrists': 'wrist pain',
    'hand': 'hand pain',
    'hands': 'hand pain',
    'hip': 'hip pain',
    'hips': 'hip pain',
    'head': 'headache', 
    'back': 'back pain',
    'stomach': 'abdominal pain',
    'belly': 'abdominal pain',
    'abdomen': 'abdominal pain',
    'joint': 'joint pain',
    'joints': 'joint pain',
    'muscle': 'muscle pain',
    'muscles': 'muscle pain'
  };

  const painIndicators = ['hurt', 'hurts', 'hurting', 'pain', 'ache', 'aching', 'aches', 'sore', 'soreness', 'discomfort', 'tender', 'tenderness', 'throb', 'throbbing', 'stiff', 'stiffness', 'cramp', 'cramping'];

  // Extract all words from user input and check for symptom matches
  const inputWords = lowerSymptoms.split(/[\s,;.\-!?()]+/).filter(w => w.length > 0);
  const symptomMatches = {};

  // First pass: Check for body part + pain indicator combinations
  for (let i = 0; i < inputWords.length; i++) {
    const word = inputWords[i];
    const nextWord = i + 1 < inputWords.length ? inputWords[i + 1] : '';
    const prevWord = i > 0 ? inputWords[i - 1] : '';
    
    // Check if current word is a body part
    if (bodyPartMap[word]) {
      // Check if next or prev word is a pain indicator
      if (painIndicators.some(pi => pi === nextWord || pi === prevWord || nextWord.includes(pi) || prevWord.includes(pi))) {
        const symptom = bodyPartMap[word];
        if (!symptomMatches[symptom]) {
          symptomMatches[symptom] = symptomKeywords[symptom];
        }
      }
    }
    
    // Check if current word is a pain indicator
    if (painIndicators.some(pi => pi === word || word.includes(pi))) {
      // Check if next or prev word is a body part
      if (bodyPartMap[nextWord] || bodyPartMap[prevWord]) {
        const symptom = bodyPartMap[nextWord] || bodyPartMap[prevWord];
        if (!symptomMatches[symptom]) {
          symptomMatches[symptom] = symptomKeywords[symptom];
        }
      }
    }
  }

  // Second pass: Check each word against symptom keywords
  for (const word of inputWords) {
    // Exact match
    if (keywordToSymptom[word]) {
      const symptom = keywordToSymptom[word];
      if (!symptomMatches[symptom]) {
        symptomMatches[symptom] = symptomKeywords[symptom];
      }
    }
    
    // Check if word is part of multi-word symptom
    for (const [alias, symptom] of Object.entries(keywordToSymptom)) {
      if (alias.includes(word) && word.length >= 3) {
        if (!symptomMatches[symptom]) {
          symptomMatches[symptom] = symptomKeywords[symptom];
        }
      }
    }
    
    // Check variations: plurals, -ing forms, base words
    const variations = [
      word,
      word + 's',
      word + 'es',
      word.endsWith('ing') ? word.slice(0, -3) : null,
      word.endsWith('y') ? word.slice(0, -1) + 'ies' : null,
      word.endsWith('ed') ? word.slice(0, -2) : null
    ].filter(Boolean);
    
    for (const variation of variations) {
      if (keywordToSymptom[variation]) {
        const symptom = keywordToSymptom[variation];
        if (!symptomMatches[symptom]) {
          symptomMatches[symptom] = symptomKeywords[symptom];
        }
      }
    }
  }

  // Third pass: Check for multi-word symptom phrases in the full text
  for (const [alias, symptom] of Object.entries(keywordToSymptom)) {
    if (alias.includes(' ') && !symptomMatches[symptom] && lowerSymptoms.includes(alias)) {
      symptomMatches[symptom] = symptomKeywords[symptom];
    }
  }

  // Analyze symptom combinations for better diagnostics
  const hasRespiratorySymptoms = ['cough', 'shortness of breath', 'sore throat', 'sinus congestion'].some(s => symptomMatches[s]);
  const hasGastrointestinalSymptoms = ['nausea', 'vomiting', 'diarrhea', 'abdominal pain', 'loss of appetite'].some(s => symptomMatches[s]);
  const hasCardiacWarning = symptomMatches['chest pain'] || (symptomMatches['shortness of breath'] && symptomMatches['anxiety']);
  const hasInfectionSignsSymptoms = ['fever', 'swollen lymph nodes', 'night sweats'].some(s => symptomMatches[s]);
  const hasMentalHealthSymptoms = ['anxiety', 'depression', 'insomnia'].some(s => symptomMatches[s]);

  // Check symptoms and accumulate findings
  const symptomsFound = [];
  const detailedFindings = [];
  
  for (const [symptom, data] of Object.entries(symptomMatches)) {
    symptomsFound.push({ symptom, ...data });
    conditions.push(data.condition);
    detailedFindings.push(`• ${symptom.charAt(0).toUpperCase() + symptom.slice(1)}: ${data.condition} (Severity: ${data.severity})`);
    
    if (data.severity === 'High') severity = 'High';
    else if (data.severity === 'Medium' && severity !== 'High') severity = 'Medium';
    
    if (data.urgency.includes('URGENT')) urgency = 'URGENT';
    else if (data.urgency.includes('ER') && urgency !== 'URGENT') urgency = 'Seek Emergency Care';
    else if (urgency === 'Non-urgent' && data.urgency.length > 20) urgency = data.urgency;
    
    recommendations.push(data.urgency);
  }

  // Refine urgency based on combinations
  if (hasCardiacWarning) {
    urgency = 'URGENT';
    severity = 'High';
    detailedFindings.push('⚠️ CARDIAC ALERT: Chest pain or shortness of breath with anxiety requires immediate evaluation');
  }
  if (hasInfectionSignsSymptoms && Object.keys(symptomMatches).length >= 2) {
    if (severity !== 'High') severity = 'Medium';
    detailedFindings.push('⚠️ Multiple infection signs detected: Consider infection/systemic illness');
  }
  if (hasRespiratorySymptoms && Object.keys(symptomMatches).length >= 3) {
    if (severity !== 'High') severity = 'Medium';
    detailedFindings.push('⚠️ Multiple respiratory symptoms: Possible viral/bacterial respiratory infection');
  }
  if (hasGastrointestinalSymptoms && Object.keys(symptomMatches).length >= 2) {
    detailedFindings.push('⚠️ Multiple GI symptoms: Possible gastroenteritis or food poisoning');
  }

  // Build comprehensive health advice based on detected conditions
  const categoryHealthAdvice = [];
  const uniqueAdvice = new Set();
  const categoryUsed = [];
  
  symptomsFound.forEach(({ treatment }) => {
    if (treatment && !categoryHealthAdvice.includes(treatment)) {
      categoryHealthAdvice.push(treatment);
    }
  });

  // Add category-specific advice with priorities
  if (hasRespiratorySymptoms) {
    healthAdviceDB.respiratory.forEach(adv => uniqueAdvice.add(adv));
    categoryUsed.push('respiratory');
  }
  if (hasGastrointestinalSymptoms) {
    healthAdviceDB.gastrointestinal.forEach(adv => uniqueAdvice.add(adv));
    categoryUsed.push('gastrointestinal');
  }
  if (conditions.some(c => c.includes('pain') || c.includes('Pain')) || Object.keys(symptomMatches).some(s => s.includes('pain'))) {
    healthAdviceDB.pain.forEach(adv => uniqueAdvice.add(adv));
    categoryUsed.push('pain');
  }
  if (hasMentalHealthSymptoms) {
    healthAdviceDB.mental.forEach(adv => uniqueAdvice.add(adv));
    categoryUsed.push('mental');
  }
  if (hasInfectionSignsSymptoms) {
    healthAdviceDB.infection.forEach(adv => uniqueAdvice.add(adv));
    categoryUsed.push('infection');
  }

  // Gather diagnostic tests needed
  const uniqueTests = new Set();
  symptomsFound.forEach(({ tests }) => {
    if (tests && Array.isArray(tests)) {
      tests.forEach(test => uniqueTests.add(test));
    }
  });

  // Build detailed analysis with context
  let analysis = '';
  if (conditions.length > 0) {
    const symptomCount = Object.keys(symptomMatches).length;
    if (symptomCount === 1) {
      analysis = `Single symptom detected: ${conditions[0]}. ${recommendations[0] || 'Monitor symptoms.'} `;
    } else if (hasCardiacWarning) {
      analysis = `CARDIAC EMERGENCY INDICATORS: ${conditions.join(' + ')}. IMMEDIATE ACTION REQUIRED. ${recommendations[0] || ''} `;
    } else if (symptomCount >= 3) {
      const commonCategory = categoryUsed[0] || 'systemic';
      analysis = `Multiple symptoms detected (${symptomCount} conditions): ${conditions.slice(0, 3).join(', ')}${conditions.length > 3 ? ', +' + (conditions.length - 3) + ' more' : ''}. Pattern suggests ${commonCategory} origin. Severity: ${severity}. ${recommendations.slice(0, 2).join(' ')} `;
    } else {
      analysis = `Detected: ${conditions.join(' + ')}. Severity: ${severity}. ${recommendations.join('. ')} `;
    }
    analysis += detailedFindings.length > 0 ? '\n' + detailedFindings.join('\n') : '';
  } else {
    analysis = 'Your symptoms may require professional evaluation. Please describe your symptoms more specifically (e.g., fever, cough, headache, etc.).';
  }

  res.json({
    analysis,
    conditions: conditions.length > 0 ? [...new Set(conditions)] : ['Requires professional evaluation'],
    severity,
    urgency,
    symptoms,
    detectedSymptoms: Object.keys(symptomMatches),
    symptomsCount: Object.keys(symptomMatches).length,
    treatments: categoryHealthAdvice.filter(t => t && t.length > 0),
    diagnosticTests: Array.from(uniqueTests).sort(),
    healthAdvice: Array.from(uniqueAdvice).length > 0 ? Array.from(uniqueAdvice) : [
      'Stay hydrated by drinking plenty of water',
      'Get adequate rest (7-9 hours of sleep)',
      'Monitor vital signs (temperature, BP, HR)',
      'Avoid stress and practice relaxation techniques',
      'Practice good hygiene to prevent spread'
    ],
    recommendations: recommendations.slice(0, 3),
    timestamp: new Date().toISOString(),
    disclaimer: 'This is AI-assisted medical analysis only. ALWAYS consult a healthcare provider for accurate diagnosis and treatment. In emergencies, call 911. This is NOT a substitute for professional medical advice.'
  });
});

router.post('/', auth, controller.createEntry);
router.get('/', auth, controller.listForUser);

module.exports = router;

