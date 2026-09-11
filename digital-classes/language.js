(function () {
  var english = localStorage.getItem('harmonyLanguage') === 'en';
  var copy = {
    device:{title:'Device Basics',shortDesc:'Learn the essential functions of smartphones and digital devices',program:'Digital Device Basics',steps:[['Smartphone Essentials',['iPhone and Galaxy basics','Display, text size, and sound settings','Take, organize, and share photos','Install and remove apps','Use QR codes']],['Computer Essentials',['Use a mouse and keyboard','Type in Korean and English','Create files and folders','Save, move, and delete files','Use the internet']],['Connecting and Managing Devices',['Connect to Wi-Fi','Use Bluetooth','Connect a smartphone and computer','Transfer photos and files','Use printers and other accessories','Basic maintenance and troubleshooting']]]},
    documents:{title:'Document Creation',shortDesc:'Build practical document creation and workplace skills',program:'Digital Document Creation',steps:[['Document Basics',['Type in Korean and English','Change fonts and text sizes','Align paragraphs and adjust spacing','Copy and paste','Undo and redo']],['Format a Document',['Organize headings and body text','Use bullets','Create tables','Insert photos and images','Build a clear document layout']],['Everyday Documents',['Notices','Application forms','Simple letters','Schedules','Class and meeting materials']],['File Management',['Save documents','Use Save As','Export as PDF','Find and revise files','Print documents']],['Share Documents',['Attach files to email','Download and upload documents','Share with links','Save to the cloud']],['Document Tools',['Microsoft Word basics','Google Docs basics','Choose the right document tool','Open and revise existing documents']]]},
    design:{title:'Design',shortDesc:'Create practical designs easily with Canva',program:'Digital Design',steps:[['Canva Basics',['Navigate Canva','Find and use templates','Explore the design workspace','Save and download designs']],['Design Elements',['Add and style text','Use photos and backgrounds','Use icons and shapes','Combine colors and fonts']],['Create Designs',['Flyers and posters','Invitations and cards','Social cards and banners','Social images and thumbnails']],['Save and Share',['Download in high quality','Export as PDF','Share with a link','Print and use your work']]]},
    youtube:{title:'YouTube',shortDesc:'Learn channel basics and video creation',program:'YouTube Essentials',steps:[['Understanding YouTube',['What YouTube is','Explore the YouTube screen','Learn key features']],['Search and Watch',['Find videos','Play, pause, and use captions','Change video quality','Create playlists']],['Subscriptions and Notifications',['Subscribe to channels','Set notifications','Like and comment']],['Share and Save',['Share videos','Copy links','Save videos to watch later']],['YouTube Shorts',['What Shorts are','Enjoy short videos','Understand how Shorts are made']],['Upload Basics',['Create an account','Upload a video','Add a title, description, and tags','Choose visibility settings']]]},
    apps:{title:'SNS & Everyday Apps',shortDesc:'Learn social media and essential everyday apps',program:'SNS & Everyday Apps',steps:[['Social Media',['KakaoTalk basics','Send photos and videos','Group chats and file sharing','Instagram basics','Facebook basics']],['Maps and Transportation',['Use Google Maps','Find routes and places','Check public transit','View live traffic','Use taxis and Uber']],['Reservations and Orders',['Book medical visits and restaurants','Reserve flights, buses, and trains','Order pickup and delivery','Book performances and tickets','Review and cancel reservations']],['Finance and Payments',['Use mobile banking','Check balances and transfer funds','Use Apple Pay and other mobile payments','Pay bills','Use financial apps safely']],['Shopping and Savings',['Shop online','Compare prices and find discounts','Use coupons and memberships','Use grocery apps','Track orders and deliveries']],['Everyday Convenience',['Check weather and news','Use translation apps','Use QR codes','Use health apps','Explore useful everyday apps']]]},
    ai:{title:'AI',shortDesc:'Learn ChatGPT and practical AI tools',program:'Practical AI',steps:[['AI Basics',['What AI is','How AI works and major types','Everyday AI examples','Use AI safely']],['Using ChatGPT',['Get started with ChatGPT','Ask better questions','Write and summarize','Translate and research','Organize ideas']],['Documents and Work',['Draft reports','Write emails','Summarize meetings','Create tables and lists','Revise and proofread documents']],['Images and Design',['Generate AI images','Change visual styles','Create simple designs','Make thumbnails and social cards','Use free tools']],['AI for Everyday Life',['Plan schedules and projects','Find travel and dining ideas','Research health and exercise','Support learning and growth','Explore useful AI apps']],['Build Your AI Routine',['Choose the right AI tools','Automate repeated work','Save time','Keep learning with AI','Use AI responsibly']]]}
  };

  if (english && window.DIGITAL_CATEGORIES) {
    window.DIGITAL_CATEGORIES.all.forEach(function (category) {
      var translated = copy[category.id];
      if (!translated) return;
      category.title = translated.title;
      category.shortDesc = translated.shortDesc;
      var program = category.programs[0];
      if (!program) return;
      program.title = translated.program;
      translated.steps.forEach(function (step, index) {
        if (!program.steps[index]) return;
        program.steps[index].title = step[0];
        program.steps[index].items = step[1];
      });
      if (program.cta) program.cta.label = 'Class Inquiry & Application';
    });
  }

  window.DIGITAL_LANGUAGE = english ? 'en' : 'ko';
  window.digitalText = function (ko, en) { return english ? en : ko; };
})();
