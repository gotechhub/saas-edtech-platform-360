-- Oguz Law Academy removable beta dataset. IDs and aliases are deterministic for cleanup.
begin;

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000001','authenticated','authenticated','respongo+ola-admin@gmail.com','$2b$12$cspg/XVETTPk/zyL3mjCz.xFrkriQN6j3eQCMvgPz7xLZF7p8EqqW',now(),'{"provider":"email","providers":["email"]}','{"display_name":"Ayşe Demir","seed":"oguz-law-academy"}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000002','authenticated','authenticated','respongo+ola-instructor@gmail.com','$2b$12$cspg/XVETTPk/zyL3mjCz.xFrkriQN6j3eQCMvgPz7xLZF7p8EqqW',now(),'{"provider":"email","providers":["email"]}','{"display_name":"Prof. Dr. Kerem Aydın","seed":"oguz-law-academy"}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000003','authenticated','authenticated','respongo+ola-manager@gmail.com','$2b$12$cspg/XVETTPk/zyL3mjCz.xFrkriQN6j3eQCMvgPz7xLZF7p8EqqW',now(),'{"provider":"email","providers":["email"]}','{"display_name":"Selin Kaya","seed":"oguz-law-academy"}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000004','authenticated','authenticated','respongo+ola-learner@gmail.com','$2b$12$cspg/XVETTPk/zyL3mjCz.xFrkriQN6j3eQCMvgPz7xLZF7p8EqqW',now(),'{"provider":"email","providers":["email"]}','{"display_name":"Mert Yılmaz","seed":"oguz-law-academy"}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000005','authenticated','authenticated','respongo+ola-learner2@gmail.com','$2b$12$cspg/XVETTPk/zyL3mjCz.xFrkriQN6j3eQCMvgPz7xLZF7p8EqqW',now(),'{"provider":"email","providers":["email"]}','{"display_name":"Derya Çetin","seed":"oguz-law-academy"}',now(),now())
on conflict(id) do update set encrypted_password=excluded.encrypted_password,email_confirmed_at=coalesce(auth.users.email_confirmed_at,now()),raw_user_meta_data=excluded.raw_user_meta_data,updated_at=now();

insert into auth.identities(id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
select gen_random_uuid(),u.id::text,u.id,jsonb_build_object('sub',u.id::text,'email',u.email,'email_verified',true,'phone_verified',false),'email',now(),now(),now()
from auth.users u where u.id in ('a1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000004','a1000000-0000-4000-8000-000000000005')
on conflict do nothing;

insert into public.industry_packs(id,key,name,status) values('b1000000-0000-4000-8000-000000000001','legal-tr','Türkiye Hukuk ve Avukatlık','published') on conflict(key) do update set name=excluded.name,status='published';
insert into public.pack_versions(id,pack_id,version,manifest,published_at) values('b2000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000001',1,'{"locale":"tr","modules":["lms","lxp","compliance","gamification","support"]}',now()) on conflict(pack_id,version) do update set manifest=excluded.manifest,published_at=excluded.published_at;
insert into public.tenants(id,name,status,industry_pack_version_id) values('c1000000-0000-4000-8000-000000000001','Oguz Law Academy','active','b2000000-0000-4000-8000-000000000001') on conflict(id) do update set name=excluded.name,status='active';
insert into public.portals(id,tenant_id,industry_segment,slug,primary_host,status) values('c2000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','avukat','oguzlawacademy','lms.respongo.com','published') on conflict(tenant_id) do update set slug=excluded.slug,primary_host=excluded.primary_host,status='published';

insert into public.roles(id,tenant_id,key,label) values
 ('d1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','tenant_admin','Kurum Yöneticisi'),
 ('d1000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000001','instructor','Eğitmen'),
 ('d1000000-0000-4000-8000-000000000003','c1000000-0000-4000-8000-000000000001','line_manager','Birim Yöneticisi'),
 ('d1000000-0000-4000-8000-000000000004','c1000000-0000-4000-8000-000000000001','learner','Öğrenen')
on conflict(tenant_id,key) do update set label=excluded.label;

insert into public.memberships(id,tenant_id,user_id,status,joined_at,job_title,professional_level,bio) values
 ('e1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','active',now()-interval '180 days','Akademi Yöneticisi','Kıdemli','Oguz Law Academy beta yöneticisi'),
 ('e1000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000002','active',now()-interval '160 days','Akademik Direktör','Uzman','Mesleki eğitim programı eğitmeni'),
 ('e1000000-0000-4000-8000-000000000003','c1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000003','active',now()-interval '140 days','Dava Takip Ekip Lideri','Kıdemli','Ekip öğrenme yöneticisi'),
 ('e1000000-0000-4000-8000-000000000004','c1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000004','active',now()-interval '120 days','Avukat','Orta','Ticaret hukuku ekibi'),
 ('e1000000-0000-4000-8000-000000000005','c1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000005','active',now()-interval '90 days','Stajyer Avukat','Başlangıç','Mesleki gelişim programı')
on conflict(tenant_id,user_id) do update set status='active',job_title=excluded.job_title,professional_level=excluded.professional_level,bio=excluded.bio;

insert into public.role_assignments(id,tenant_id,membership_id,role_id) values
 ('e2000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001'),
 ('e2000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000002'),
 ('e2000000-0000-4000-8000-000000000003','c1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000003','d1000000-0000-4000-8000-000000000003'),
 ('e2000000-0000-4000-8000-000000000004','c1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000004','d1000000-0000-4000-8000-000000000004'),
 ('e2000000-0000-4000-8000-000000000005','c1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000005','d1000000-0000-4000-8000-000000000004')
on conflict(membership_id,role_id) do nothing;

insert into public.teams(id,tenant_id,code,name,manager_membership_id) values('f1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','ticaret-hukuku','Ticaret Hukuku Ekibi','e1000000-0000-4000-8000-000000000003') on conflict(tenant_id,code) do update set name=excluded.name,manager_membership_id=excluded.manager_membership_id;
insert into public.team_members(id,tenant_id,team_id,membership_id) values
 ('f2000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000004'),
 ('f2000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000005')
on conflict(team_id,membership_id) do nothing;

insert into public.courses(id,tenant_id,title,summary,category,source_type,status,required_default,duration_minutes,current_version) values
 ('11000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','KVKK ve Avukatlıkta Veri Güvenliği','Müvekkil verisi, özel nitelikli veri ve ihlal süreçleri.','Uyumluluk','native','published',true,55,1),
 ('11000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000001','Meslek Etiği ve Çıkar Çatışması','Vaka tabanlı etik karar pratiği.','Mesleki Yetkinlik','native','published',true,45,1),
 ('11000000-0000-4000-8000-000000000003','c1000000-0000-4000-8000-000000000001','Dava Stratejisi Masterclass','Dosya analizi ve duruşma stratejisi.','Masterclass','video','published',false,120,1),
 ('11000000-0000-4000-8000-000000000004','c1000000-0000-4000-8000-000000000001','Sözleşme İnceleme Teknikleri','Risk maddeleri ve müzakere kontrol listeleri.','Ticaret Hukuku','scorm12','published',false,75,1),
 ('11000000-0000-4000-8000-000000000005','c1000000-0000-4000-8000-000000000001','İş Sağlığı ve Güvenliği','Ofis ve saha görevlerinde zorunlu İSG eğitimi.','Zorunlu Eğitim','video','published',true,40,1),
 ('11000000-0000-4000-8000-000000000006','c1000000-0000-4000-8000-000000000001','Etkili Hukuki Yazım','Dilekçe ve hukuki görüş yazım standardı.','Kişisel Gelişim','document','published',false,35,1),
 ('11000000-0000-4000-8000-000000000007','c1000000-0000-4000-8000-000000000001','Müzakere ve Arabuluculuk','Çıkar analizi ve anlaşma tasarımı.','Uyuşmazlık Çözümü','live','published',false,90,1),
 ('11000000-0000-4000-8000-000000000008','c1000000-0000-4000-8000-000000000001','Bilgi Güvenliği Farkındalığı','Kimlik avı, parola ve güvenli dosya paylaşımı.','Uyumluluk','native','published',true,30,1)
on conflict(id) do update set summary=excluded.summary,status='published';

insert into public.course_versions(id,tenant_id,course_id,version,status,content,launch_uri,published_at)
select ('12000000-0000-4000-8000-'||lpad(row_number() over(order by id)::text,12,'0'))::uuid,tenant_id,id,1,'published',jsonb_build_object('seed','oguz-law-academy','modules',4),case when source_type='scorm12' then '/lab/scorm' else '/avukat/oguzlawacademy' end,now()-interval '30 days' from public.courses where tenant_id='c1000000-0000-4000-8000-000000000001'
on conflict(course_id,version) do update set status='published',content=excluded.content,published_at=excluded.published_at;

insert into public.programs(id,tenant_id,title,description,mode,status) values
 ('13000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','Avukatlıkta İlk 30 Gün','Yeni başlayanlar için zorunlu onboarding yolculuğu.','ordered','published'),
 ('13000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000001','Avukatlık Masterclass','Vaka, strateji ve müzakere odaklı gelişim yolu.','flexible','published'),
 ('13000000-0000-4000-8000-000000000003','c1000000-0000-4000-8000-000000000001','2026 Zorunlu Uyum Programı','KVKK, İSG ve bilgi güvenliği paketi.','ordered','published')
on conflict(id) do update set description=excluded.description,status='published';

insert into public.program_items(id,tenant_id,program_id,course_id,position,required) values
 ('14000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','13000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000002',1,true),
 ('14000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000001','13000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000006',2,true),
 ('14000000-0000-4000-8000-000000000003','c1000000-0000-4000-8000-000000000001','13000000-0000-4000-8000-000000000002','11000000-0000-4000-8000-000000000003',1,true),
 ('14000000-0000-4000-8000-000000000004','c1000000-0000-4000-8000-000000000001','13000000-0000-4000-8000-000000000002','11000000-0000-4000-8000-000000000007',2,false),
 ('14000000-0000-4000-8000-000000000005','c1000000-0000-4000-8000-000000000001','13000000-0000-4000-8000-000000000003','11000000-0000-4000-8000-000000000001',1,true),
 ('14000000-0000-4000-8000-000000000006','c1000000-0000-4000-8000-000000000001','13000000-0000-4000-8000-000000000003','11000000-0000-4000-8000-000000000005',2,true),
 ('14000000-0000-4000-8000-000000000007','c1000000-0000-4000-8000-000000000001','13000000-0000-4000-8000-000000000003','11000000-0000-4000-8000-000000000008',3,true)
on conflict(program_id,position) do update set course_id=excluded.course_id,required=excluded.required;

insert into public.learning_assignments(id,tenant_id,course_id,title,audience_type,audience_rule,required,due_at,pass_score,status,starts_at) values
 ('15000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001','KVKK 2026 Zorunlu Ataması','everyone','{}',true,now()+interval '12 days',80,'active',now()-interval '20 days'),
 ('15000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000004','Sözleşme İnceleme Gelişim Ataması','team','{"team":"ticaret-hukuku"}',false,now()+interval '30 days',70,'active',now()-interval '10 days'),
 ('15000000-0000-4000-8000-000000000003','c1000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000005','İSG Yıllık Yenileme','everyone','{}',true,now()-interval '2 days',80,'active',now()-interval '45 days'),
 ('15000000-0000-4000-8000-000000000004','c1000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000003','Dava Stratejisi Masterclass','role','{"role":"learner"}',false,now()+interval '45 days',70,'active',now()-interval '5 days')
on conflict(id) do update set due_at=excluded.due_at,status='active';

insert into public.enrollments(id,tenant_id,assignment_id,membership_id,state,progress,score,assigned_at,started_at,completed_at,last_activity_at,attempt_count) values
 ('16000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000004','in_progress',65,null,now()-interval '20 days',now()-interval '18 days',null,now()-interval '1 day',1),
 ('16000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000004','completed',100,92,now()-interval '10 days',now()-interval '9 days',now()-interval '3 days',now()-interval '3 days',1),
 ('16000000-0000-4000-8000-000000000003','c1000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000004','expired',20,45,now()-interval '45 days',now()-interval '40 days',null,now()-interval '15 days',1),
 ('16000000-0000-4000-8000-000000000004','c1000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000004','e1000000-0000-4000-8000-000000000004','assigned',0,null,now()-interval '5 days',null,null,null,0),
 ('16000000-0000-4000-8000-000000000005','c1000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000005','completed',100,88,now()-interval '20 days',now()-interval '19 days',now()-interval '6 days',now()-interval '6 days',1),
 ('16000000-0000-4000-8000-000000000006','c1000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000005','in_progress',40,null,now()-interval '10 days',now()-interval '8 days',null,now()-interval '2 hours',1)
on conflict(assignment_id,membership_id) do update set state=excluded.state,progress=excluded.progress,score=excluded.score,last_activity_at=excluded.last_activity_at;

insert into public.learning_resources(id,tenant_id,title,description,resource_type,topic,status,external_url) values
 ('17000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','KVKK İhlal Bildirim Kontrol Listesi','İlk 72 saat için uygulanabilir kontrol listesi.','checklist','KVKK','published','https://www.kvkk.gov.tr/'),
 ('17000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000001','Duruşma Hazırlık Şablonu','Dosya özeti, delil ve talep hazırlık şablonu.','template','Dava Yönetimi','published','https://www.barobirlik.org.tr/'),
 ('17000000-0000-4000-8000-000000000003','c1000000-0000-4000-8000-000000000001','Meslek Kuralları Kaynağı','Güncel meslek kurallarına hızlı erişim.','link','Meslek Etiği','published','https://www.barobirlik.org.tr/'),
 ('17000000-0000-4000-8000-000000000004','c1000000-0000-4000-8000-000000000001','Sözleşme Risk Haritası','Temel sözleşme maddeleri için risk sınıflandırması.','document','Ticaret Hukuku','published','https://www.respongo.com/')
on conflict(id) do update set description=excluded.description,status='published';

insert into public.attempts(id,tenant_id,enrollment_id,attempt_no,state,started_at,submitted_at,graded_at,score_bp,success,completion) values
 ('18000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','16000000-0000-4000-8000-000000000002',1,'graded',now()-interval '9 days',now()-interval '3 days',now()-interval '3 days',9200,true,true),
 ('18000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000001','16000000-0000-4000-8000-000000000005',1,'graded',now()-interval '19 days',now()-interval '6 days',now()-interval '6 days',8800,true,true)
on conflict(enrollment_id,attempt_no) do update set state='graded',score_bp=excluded.score_bp,success=true,completion=true;
insert into public.progress_snapshots(id,tenant_id,enrollment_id,completion_bp,last_object_key,measured_seconds,last_event_at) values
 ('19000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','16000000-0000-4000-8000-000000000001',6500,'kvkk/modul-3',2100,now()-interval '1 day'),
 ('19000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000001','16000000-0000-4000-8000-000000000002',10000,'sozlesme/tamamlandi',4200,now()-interval '3 days'),
 ('19000000-0000-4000-8000-000000000003','c1000000-0000-4000-8000-000000000001','16000000-0000-4000-8000-000000000005',10000,'kvkk/tamamlandi',3000,now()-interval '6 days'),
 ('19000000-0000-4000-8000-000000000004','c1000000-0000-4000-8000-000000000001','16000000-0000-4000-8000-000000000006',4000,'sozlesme/modul-2',1600,now()-interval '2 hours')
on conflict(enrollment_id) do update set completion_bp=excluded.completion_bp,last_object_key=excluded.last_object_key,measured_seconds=excluded.measured_seconds,last_event_at=excluded.last_event_at;
insert into public.completion_records(id,tenant_id,enrollment_id,attempt_id,policy_version,completed_at,success,provenance,evidence) values
 ('1a000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','16000000-0000-4000-8000-000000000002','18000000-0000-4000-8000-000000000001',1,now()-interval '3 days',true,'verified','{"seed":"oguz-law-academy","score":92}'),
 ('1a000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000001','16000000-0000-4000-8000-000000000005','18000000-0000-4000-8000-000000000002',1,now()-interval '6 days',true,'verified','{"seed":"oguz-law-academy","score":88}')
on conflict(enrollment_id,attempt_id,policy_version,provenance) do update set evidence=excluded.evidence;

insert into public.audit_events(tenant_id,actor_user_id,acting_role,action,resource_kind,resource_id,reason,redacted_diff) values
 ('c1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','tenant_admin','seed.loaded','tenant','c1000000-0000-4000-8000-000000000001','Beta portal örnek veri paketi','{"seed":"oguz-law-academy","users":5,"courses":8,"programs":3}');

commit;