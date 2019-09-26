# R-Vision homework

Console SSH client

Необходимо создать консольную утилиту, которая будет представлять собой полноценный ssh-клиент, то есть утилита должна транслировать команды вводимые пользователем на удаленную систему и получать результат их выполнения. 

Дополнительно нужно реализовать собственную команду `get <filename>` при вводе которой, утилита будет скачивать с удаленного сервера указанный файл.

```
MacBook:ssh-test dos$ node ssh.js root:pass@10.1.0.1
[18:29:12] Connecting to 10.1.0.1...
[18:29:15] Connection successful.
Last login: Sun Nov 13 23:03:01 2018 from 10.1.0.2
root@mainsrv:~# cd /etc
root@mainsrv:/etc# ls | grep deb
debconf.conf
debian_version
root@mainsrv:/etc# get debian_version
[18:29:44] Downloading 10.1.0.1:/etc/debian_version from to 127.0.0.1:/Users/dos/www/ssh-test/
[18:29:46] File is downloaded successfully
root@mainsrv:/etc# exit
MacBook:ssh-test dos$ ls
debian_version  node_modules    npm-debug.log   package.json    ssh.js
MacBook:ssh-test dos$ cat debian_version
jessie/sid
MacBook:ssh-test dos$
```

Дополнительная часть, чтобы определить ваш уровень:

- [x] Реализовать отправку файлов на удаленный сервер (команда put /path/to/localfile)
- [ ] Реализовать возможность автодополнения по нажатию Tab, как в нативном SSH клиенте
- [ ] Реализовать корректную обработку комбинации клавиш Ctrl+C для выхода из программы внутри ssh-сессии, например когда запущена команда top
- [x] SSH клиент должен уметь пробрасывать порты на локальную машину (то есть создавать полноценные SSH-тунели `[-L [bind_address:]port:host:hostport]`).
- [x] SSH клиент должен уметь пробрасывать порты на удаленную машину `[-R [bind_address:]port:host:hostport]`
- [x] Покрыть написанный код тестами.

## TODO

- при нажатии Backspace, удаляется префикс ssh - предложение к вводу команд
- nano text editor don't work
- top / down keypress don't work
- 'Connection successful.' - отображается, когда ssh еще не подключился

## Полезные ссылки

- https://github.com/mscdex/ssh2
- https://github.com/mscdex/ssh2-streams
- https://github.com/Stocard/node-ssh-forward
