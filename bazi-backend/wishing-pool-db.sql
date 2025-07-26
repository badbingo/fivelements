PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE IF NOT EXISTS "wishes" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT,  -- 明确允许NULL
  bazi TEXT DEFAULT '',
  content TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  visibility TEXT DEFAULT 'public',
  blessings INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT DEFAULT (datetime(CURRENT_TIMESTAMP, '+30 days')),
  is_fulfilled INTEGER DEFAULT 0,
  birth_date TEXT DEFAULT '',
  birth_time TEXT DEFAULT '',
  user_id TEXT,
  solar_date TEXT
, fulfilled_at INTEGER);
INSERT INTO wishes VALUES(23,'林小甜','辛巳 甲午 辛丑 辛卯','希望这个月能和社团里那个总对我笑的学长有更多接触！哪怕他主动约我去食堂吃顿饭，或者自习室坐我旁边也行啊！最好月底前能加到他微信，别让我再每天偷偷翻他朋友圈了！','love','public',4,1,'2025-06-23 14:08:17','2025-07-23 14:08:17',0,'2001-06-07','5-7','6.0','2025-06-23',NULL);
INSERT INTO wishes VALUES(24,'王多钱','丁卯 丁未 戊午 癸丑','这个月一定要接到两个靠谱的合作！甲方爸爸别拖尾款，别让我天天催账像讨债的。要是能多赚5000块，我就奖励自己吃顿火锅！','wealth','public',5,2,'2025-06-23 14:10:24','2025-07-23 14:10:24',0,'1987-07-08','1-3','6.0','2025-06-23',NULL);
INSERT INTO wishes VALUES(25,'刘秃然','己卯 丁卯 己巳 庚午','这个月一定要12点前睡觉！黑眼圈退散！发际线稳住！求求颈椎病别犯了，让我安安稳稳画完这个月的图就行。','health','public',3,1,'2025-06-23 14:14:40','2025-07-23 14:14:40',1,'1999-03-18','11-13','6.0','2025-06-23',1751119963);
INSERT INTO wishes VALUES(26,'杨凤鸣','癸丑 辛酉 乙卯 己卯','老公这个月少加点班，周末能陪孩子去趟动物园。儿子写作业别磨蹭到半夜了，每天能9点前搞定我就谢天谢地！','family','public',3,1,'2025-06-23 14:27:20','2025-07-23 14:27:20',0,'1973-09-16','5-7','6.0','2025-06-23',NULL);
INSERT INTO wishes VALUES(27,'李长春','丙辰 癸巳 己巳 甲戌','生意赶紧好起来吧！这个月能把欠供应商的钱还上一半就行。最好能发展几个固定的大客户，别让我天天愁房租了。','wealth','public',5,2,'2025-06-23 14:28:58','2025-07-23 14:28:58',0,'1976-05-17','19-21','6.0','2025-06-23',NULL);
INSERT INTO wishes VALUES(28,'赵卷王','壬戌 丙午 丙寅 庚寅','这个季度考核必须拿A！老板画的饼我吃腻了，要么加薪要么升职，再不行给点实在的奖金也行。月底前得跟领导好好谈谈，不能再当老实人了！','wealth','public',8,2,'2025-06-23 14:30:13','2025-07-23 14:30:13',1,'1982-06-12','3-5','6.0','2025-06-23',1751008560);
INSERT INTO wishes VALUES(29,'周学霸','庚寅 戊寅 甲寅 戊辰','最后一次模拟考必须冲进年级前30！数学大题不能再粗心算错了，英语作文求求老师多给点分。月底前要把错题本全部过一遍！','study','public',15,4,'2025-06-23 14:31:26','2025-07-23 14:31:26',1,'2010-03-05','7-9','6.0','2025-06-23',1751117947);
INSERT INTO wishes VALUES(30,'吴松晓','辛巳 壬寅 甲辰 丙寅','必须减肥了！月底前要瘦8斤！健身房卡别再闲置了，晚上少吃点外卖。要是能戒掉宵夜，我就奖励自己买那双看中好久的新鞋！','health','public',9,2,'2025-06-23 14:34:31','2025-07-23 14:34:31',1,'2002-02-05','3-5','6.0','2025-06-23',1751265682);
INSERT INTO wishes VALUES(31,'刘泰山','辛巳 辛卯 丙申 辛卯','这个月一定要学会用Python处理数据！不能再被同事笑话‘Excel菜鸟’了。老板上次说的数据分析报表，这次必须做得漂漂亮亮的！','study','private',17,4,'2025-06-23 14:37:09','2025-07-23 14:37:09',1,'2001-04-03','5-7','6.0','2025-06-23',1752384857);
INSERT INTO wishes VALUES(32,'程学斌','辛巳 甲午 丁卯 壬寅','下周公司有个新的部门成立，我希望成成为部门经理。','wealth','public',21,5,'2025-06-23 14:44:31','2025-07-23 14:44:31',1,'2001-07-03','3-5','6.0','2025-06-23',1752849035);
INSERT INTO wishes VALUES(33,'蒋豆豆','乙酉 壬午 庚寅 戊寅','小红书爆火 成为人见人爱的大网红 一帆风顺 干啥啥成功 一切心想事成','wealth','public',25,5,'2025-06-23 15:09:05','2025-07-23 15:09:05',1,'2005-07-05','3-5','6.0','2025-06-23',1752582984);
INSERT INTO wishes VALUES(34,'Kevin J','丁未 辛亥 丙申 甲午','我的工作碰到一些阻碍，我希望尽快能扭转乾坤。让我能顺利找到一份我所喜欢的工作。','wealth','public',25,5,'2025-06-24 01:18:53','2025-07-24 01:18:53',1,'1967-11-28','11-13','6.0','2025-06-24',1752899946);
INSERT INTO wishes VALUES(35,'朱晓兰','戊寅 丁巳 甲寅 甲子','最近工作有些不顺，跟了5个单子都没有结果。我新希望在近期能有好消息，就算有一个能成单也是好的。','wealth','public',10,3,'2025-06-25 03:22:28','2025-07-25 03:22:28',1,'1998-05-07','23-1','6.0','2025-06-25',1752899956);
INSERT INTO wishes VALUES(36,'林翠芳','丁丑 甲辰 己卯 戊辰','我对最近刚认识的张先生颇有好感，希望我们能有进一步的发展。','love','public',15,4,'2025-06-27 04:41:28','2025-07-27 04:41:28',1,'1997-04-07','7-9','6.0','2025-06-27',1752541660);
INSERT INTO wishes VALUES(37,'王艺博','己丑 戊辰 己酉 甲子','月底要考SAT，我希望可以考一个理想的分数。希望我这段时间的备考一切顺利。','study','public',13,3,'2025-06-28 08:38:09','2025-07-28 08:38:09',1,'2009-05-04','23-1','6.0','2025-06-28',1752900391);
INSERT INTO wishes VALUES(38,'李可民','庚辰 甲申 壬寅 丁未','公司市场部经理空缺了，我希望能被提升成为市场部经理。我觉得我的资历和能力都能胜任这个职位。','wealth','public',10,3,'2025-07-02 15:01:01','2025-08-01 15:01:01',1,'2000-08-12','13-15','6.0','2025-07-02',1752900486);
INSERT INTO wishes VALUES(41,'王蓓燕','戊午 己未 乙酉 丁丑','今天打麻将目前还是输，我希望在接下来3个小时内财运大爆发，把输的都赢回来。','wealth','private',6,2,'2025-07-15 13:37:43','2025-08-14 13:37:43',1,'1978-07-22','1-3','6.0','2025-07-15',1752852990);
CREATE TABLE IF NOT EXISTS "users" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at INTEGER NOT NULL
, balance REAL DEFAULT 0, token TEXT);
INSERT INTO users VALUES(6,'Owen','owenjass@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1750139828633,25,NULL);
INSERT INTO users VALUES(7,'Owenjass','owenjass@outlook.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1751793673626,0,NULL);
INSERT INTO users VALUES(8,'Owenj','owenjass@qq.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1751794354393,2,NULL);
CREATE TABLE bless_records (   id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,   wish_id INTEGER NOT NULL,   user_id TEXT NOT NULL,   count INTEGER NOT NULL DEFAULT 1,   first_blessed_at INTEGER NOT NULL,   last_blessed_at INTEGER NOT NULL );
INSERT INTO bless_records VALUES(20,24,'6.0',5,1750687850640,1752316294058);
INSERT INTO bless_records VALUES(21,25,'6.0',3,1750689126596,1751469985194);
INSERT INTO bless_records VALUES(22,28,'6.0',8,1750689159866,1751099766902);
INSERT INTO bless_records VALUES(23,29,'6.0',15,1750689507673,1751360927618);
INSERT INTO bless_records VALUES(24,31,'6.0',17,1750689525453,1752376943694);
INSERT INTO bless_records VALUES(25,27,'6.0',5,1750689585863,1751470132527);
INSERT INTO bless_records VALUES(26,30,'6.0',9,1750689650192,1751550526998);
INSERT INTO bless_records VALUES(27,32,'6.0',21,1750689921882,1752463997801);
INSERT INTO bless_records VALUES(28,26,'6.0',3,1750689949530,1751191028738);
INSERT INTO bless_records VALUES(29,33,'6.0',25,1750691358278,1751125954178);
INSERT INTO bless_records VALUES(30,34,'6.0',25,1750727968596,1751190751367);
INSERT INTO bless_records VALUES(31,35,'6.0',10,1750821763708,1752545425791);
INSERT INTO bless_records VALUES(32,36,'6.0',15,1750999319771,1752426555465);
INSERT INTO bless_records VALUES(33,37,'6.0',13,1751099903149,1752762471653);
INSERT INTO bless_records VALUES(34,23,'6.0',4,1751119960393,1752316104663);
INSERT INTO bless_records VALUES(35,38,'6.0',10,1751468481372,1752426464474);
INSERT INTO bless_records VALUES(36,39,'6.0',10,1751726683590,1752580126959);
INSERT INTO bless_records VALUES(37,40,'6.0',7,1752389835100,1752591443909);
INSERT INTO bless_records VALUES(38,41,'6.0',5,1752586683538,1752849014150);
INSERT INTO bless_records VALUES(39,41,'8.0',1,1752642313789,1752642313789);
CREATE TABLE curse_records (     id INTEGER PRIMARY KEY AUTOINCREMENT,     curse_id INTEGER NOT NULL,     user_id TEXT NOT NULL,     count INTEGER NOT NULL DEFAULT 1,     first_blessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     last_blessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     FOREIGN KEY (curse_id) REFERENCES curse(id),     FOREIGN KEY (user_id) REFERENCES "users"(id) );
INSERT INTO curse_records VALUES(10,17,'6.0',18,1750690947008,1752464043705);
INSERT INTO curse_records VALUES(11,18,'6.0',25,1750691224063,1752464021428);
INSERT INTO curse_records VALUES(12,19,'6.0',9,1750729075680,1752209344391);
INSERT INTO curse_records VALUES(13,17,'8.0',1,1751794724932,1751794724932);
CREATE TABLE curse (     id INTEGER PRIMARY KEY AUTOINCREMENT,     user_name TEXT NOT NULL DEFAULT '匿名用户',     target_description TEXT NOT NULL,     content TEXT NOT NULL,     type TEXT NOT NULL,     visibility TEXT NOT NULL DEFAULT 'public',     blessings INTEGER NOT NULL DEFAULT 0,     level INTEGER NOT NULL DEFAULT 1,     is_fulfilled BOOLEAN NOT NULL DEFAULT 0,     user_id TEXT NOT NULL,     solar_date TEXT NOT NULL,     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     fulfilled_at TIMESTAMP );
INSERT INTO curse VALUES(17,'郭奕成','在日本的中国人 男','这个是在日本的一个无良司机在服务过程服务态度极差，后拉我们入500人大群开黄腔辱骂我们。让我们这次日本之行非常的不愉快。希望这股负能量能及时化解。','other','public',19,4,1,'6.0','2025-06-23','2025-06-23 15:02:15',1751177700);
INSERT INTO curse VALUES(18,'kirito','02年 日籍华人 175左右 戴眼镜 微胖 头发往后梳','这是我们在日本旅游时碰到的无良导游公司的司机，服务态度及其恶劣。找各种机会对我们敲诈勒索，之后在加我们微信进行各种咒骂。希望所有的负能量都被化解。天地自有公正，恶人必会有恶报。','other','public',25,5,1,'6.0','2025-06-23','2025-06-23 15:06:53',1751177693);
INSERT INTO curse VALUES(19,'朱卫国','46岁，男性，162左右身高，100公斤左右，长相凶狠','他是我的主管，在工作中一直给我穿小鞋，处处都刁难了。我实在是忍无可忍，但有不能失去这份工作。','wealth','public',9,2,1,'6.0','2025-06-24','2025-06-24 01:37:32',1751857849);
CREATE TABLE payment_notifications (   id INTEGER PRIMARY KEY AUTOINCREMENT,   order_id TEXT NOT NULL,   notification_data TEXT NOT NULL,   created_at INTEGER NOT NULL );
CREATE TABLE recharges (   id INTEGER PRIMARY KEY AUTOINCREMENT,   order_id TEXT NOT NULL,   user_id INTEGER NOT NULL,   amount REAL NOT NULL,   payment_method TEXT NOT NULL,   created_at INTEGER NOT NULL,   FOREIGN KEY (user_id) REFERENCES "users"(id),   FOREIGN KEY (order_id) REFERENCES recharge_orders(order_id) );
CREATE TABLE recharge_orders (   id INTEGER PRIMARY KEY AUTOINCREMENT,   order_id TEXT UNIQUE NOT NULL,   user_id INTEGER NOT NULL,   amount REAL NOT NULL,   payment_method TEXT NOT NULL DEFAULT 'unknown',   status TEXT NOT NULL DEFAULT 'pending',   created_at INTEGER NOT NULL,   updated_at INTEGER,   FOREIGN KEY (user_id) REFERENCES "users"(id) );
INSERT INTO recharge_orders VALUES(2,'R1752670299293941',8,1,'wechat','completed',1752670299,NULL);
INSERT INTO recharge_orders VALUES(3,'R1752670728455278',8,1,'wechat','completed',1752670728,NULL);
INSERT INTO recharge_orders VALUES(4,'R1752671901284164',6,1,'wechat','completed',1752671901,NULL);
INSERT INTO recharge_orders VALUES(5,'R1752672506638823',6,1,'wechat','completed',1752672506,NULL);
INSERT INTO recharge_orders VALUES(6,'R1752673857001135',6,1,'wechat','completed',1752673857,NULL);
INSERT INTO recharge_orders VALUES(7,'R1752674599961670',6,1,'wechat','completed',1752674599,NULL);
INSERT INTO recharge_orders VALUES(8,'R1752676369216406',6,1,'wechat','pending',1752676369,NULL);
INSERT INTO recharge_orders VALUES(9,'R1752676587186723',6,1,'alipay','pending',1752676587,NULL);
INSERT INTO recharge_orders VALUES(10,'R1752680122011209',6,1,'wechat','pending',1752680122,NULL);
INSERT INTO recharge_orders VALUES(11,'R1752680605993580',6,1,'wechat','pending',1752680605,NULL);
INSERT INTO recharge_orders VALUES(12,'R1752680676022304',6,1,'alipay','pending',1752680676,NULL);
INSERT INTO recharge_orders VALUES(13,'R1752680695138362',6,1,'alipay','pending',1752680695,NULL);
INSERT INTO recharge_orders VALUES(14,'R1752680902339567',6,1,'wechat','pending',1752680902,NULL);
INSERT INTO recharge_orders VALUES(15,'R1752711957587592',6,1,'wechat','completed',1752711957,NULL);
INSERT INTO recharge_orders VALUES(16,'R1752718052246200',6,1,'wechat','completed',1752718052,NULL);
INSERT INTO recharge_orders VALUES(17,'R1752721034660442',6,1,'wechat','completed',1752721034,NULL);
INSERT INTO recharge_orders VALUES(18,'R1752729889305279',6,1,'wechat','completed',1752729889,NULL);
INSERT INTO recharge_orders VALUES(19,'R1752729895472527',6,1,'wechat','pending',1752729895,NULL);
INSERT INTO recharge_orders VALUES(20,'R1752745975121502',6,1,'wechat','pending',1752745975,NULL);
INSERT INTO recharge_orders VALUES(21,'R1752751327374485',6,1,'wechat','pending',1752751327,NULL);
INSERT INTO recharge_orders VALUES(22,'R1752770057954893',6,1,'wechat','completed',1752770057,NULL);
INSERT INTO recharge_orders VALUES(23,'R1752802496145316',6,1,'wechat','completed',1752802496,NULL);
CREATE TABLE IF NOT EXISTS "usersOld" (   id INTEGER PRIMARY KEY,   username TEXT,   email TEXT,   password_hash TEXT,   balance REAL NOT NULL DEFAULT 0,    created_at INTEGER,   updated_at INTEGER );
INSERT INTO usersOld VALUES(6,'Owen','owenjass@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1750139828633,21,NULL);
INSERT INTO usersOld VALUES(7,'Owenjass','owenjass@outlook.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1751793673626,0,NULL);
INSERT INTO usersOld VALUES(8,'Owenj','owenjass@qq.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1751794354393,2,NULL);
CREATE TABLE transactions (   id TEXT PRIMARY KEY,   user_id INTEGER NOT NULL,   amount DECIMAL(10,2) NOT NULL,   type TEXT NOT NULL,    status TEXT NOT NULL,    description TEXT,   created_at INTEGER,   FOREIGN KEY (user_id) REFERENCES users(id) );
CREATE TABLE fulfillments (   id INTEGER PRIMARY KEY AUTOINCREMENT,   wish_id INTEGER NOT NULL,   user_id INTEGER NOT NULL,   amount DECIMAL(10,2) NOT NULL,   payment_method TEXT NOT NULL,    transaction_id TEXT,   created_at INTEGER,   FOREIGN KEY (wish_id) REFERENCES wishes(id),   FOREIGN KEY (user_id) REFERENCES users(id),   FOREIGN KEY (transaction_id) REFERENCES transactions(id) );
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('wishes',41);
INSERT INTO sqlite_sequence VALUES('bless_records',39);
INSERT INTO sqlite_sequence VALUES('curse',19);
INSERT INTO sqlite_sequence VALUES('curse_records',13);
INSERT INTO sqlite_sequence VALUES('users',8);
INSERT INTO sqlite_sequence VALUES('recharge_orders',23);
