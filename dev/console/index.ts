import {send, hook, world} from 'bot';
import {notify} from 'ui';
import {settings} from 'settings/bot';
import * as fs from 'fs';

export function write(msg: string, name: string = '', nameClass: string = ''): void {
    var msgEl = document.createElement('li');
    if (nameClass) {
        msgEl.setAttribute('class', nameClass);
    }

    var nameEl = document.createElement('span');
    nameEl.textContent = name;

    var contentEl = document.createElement('span');
    if (name) {
        contentEl.textContent = `: ${msg}`;
    } else {
        contentEl.textContent = msg;
    }
    msgEl.appendChild(nameEl);
    msgEl.appendChild(contentEl);

    var chat = document.querySelector('#mb_console ul');
    chat.appendChild(msgEl);
}

export function clear(): void {
    var chat = document.querySelector('#mb_console ul');
    chat.innerHTML = '';
}

// TODO: Parse these and provide options to show/hide different ones.
hook.on('world.other', function(message: string) {
    write(message, undefined, 'other');
});

hook.on('world.message', function(name: string, message: string) {
    let msgClass = 'player';
    if (world.isStaff(name)) {
        msgClass = 'staff';
        if (world.isMod(name)) {
            msgClass += ' mod';
        } else {
            //Has to be admin
            msgClass += ' admin';
        }
    }
    if (message.startsWith('/')) {
        msgClass += ' command';
    }
    write(message, name, msgClass);
});

hook.on('world.serverchat', function(message: string) {
    write(message, 'SERVER', 'admin');
});

hook.on('world.send', function(message: string) {
    if (message.startsWith('/')) {
        write(message, 'SERVER', 'admin command');
    }
});

//Message handlers
hook.on('world.join', function handlePlayerJoin(name: string, ip: string) {
    write(`${name} (${ip}) has joined the server`, 'SERVER', 'join world admin');
});

hook.on('world.leave', function handlePlayerLeave(name: string) {
    write(`${name} has left the server`, 'SERVER', `leave world admin`);
});

export const tab = document.createElement('div');
tab.id = 'mb_console';
tab.innerHTML = '<style>' +
    fs.readFileSync(__dirname + '/style.css', 'utf8') +
    '</style>' +
    fs.readFileSync(__dirname + '/tab.html', 'utf8');

// If enabled, show messages for new chat when not on the console page
hook.on('world.chat', function(name: string, message: string): void {
    if (settings.notify && !tab.classList.contains('visible')) {
        notify(`${name}: ${message}`, 1.5);
    }
});


// Auto scroll when new messages are added to the page, unless the owner is reading old chat.
(new MutationObserver(function showNewChat() {
    let container = tab.querySelector('.chat');
    let lastLine = tab.querySelector('li:last-child');

    if (!container || !lastLine) {
        return;
    }

    if (container.scrollHeight - container.clientHeight - container.scrollTop <= lastLine.clientHeight * 10) {
        lastLine.scrollIntoView(false);
    }
})).observe(tab.querySelector('.chat'), {childList: true, subtree: true});


// Remove old chat to reduce memory usage
(new MutationObserver(function removeOldChat() {
    var chat = tab.querySelector('ul');

    while (chat.children.length > 500) {
        chat.children[0].remove();
    }
})).observe(tab.querySelector('.chat'), {childList: true, subtree: true});

// Listen for the user to send messages
function userSend() {
    var input = tab.querySelector('input');
    hook.fire('console.send', input.value);
    send(input.value);
    input.value = '';
    input.focus();
}

tab.querySelector('input').addEventListener('keydown', function(event: KeyboardEvent) {
    if (event.key == "Enter" || event.keyCode == 13) {
        userSend();
    }
});

tab.querySelector('button').addEventListener('click', userSend);