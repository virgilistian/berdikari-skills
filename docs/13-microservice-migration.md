# Future Microservice Migration Strategy

Memilih **Modular Monolith** sejak hari pertama (Day-1) adalah keputusan arsitektur yang bijak agar startup bisa cepat mencapai Product-Market Fit. Jika beban transaksi mulai masuk ke fase ratusan ribu/hari, sistem telah siap dipisah dengan pola berikut:

## 1. Menerapkan Strangler Fig Pattern
Karena backend telah terisolasi dalam folder `Modules/`, migrasi bisa dilakukan secara bertahap. Modul yang mengonsumsi CPU terbesar (biasanya Modul **Inventory** atau **Reporting**) akan dicabut dari monolith dan di-deploy sebagai entitas API independen.

## 2. Event Bus Independence
Sistem yang saat ini bergantung pada Upstash Redis / Laravel Horizon (dalam lingkup satu monolith) akan digantikan dengan **Enterprise Message Broker** seperti Apache Kafka atau RabbitMQ.
- Monolith akan memublikasikan event (e.g. `OrderCompleted`) ke Kafka.
- Microservice Inventory berlangganan pada topik Kafka tersebut tanpa mengetahui keberadaan sistem monolith.

## 3. Database Splitting
Skema yang awalnya dikumpulkan di satu Supabase Instance akan dipisah sesuai modul (*Database per Service Pattern*). Modul `Sales` memiliki DB sendiri, terpisah dari DB `Inventory`. Hal ini mencegah bottle-neck koneksi dan single point of failure.
