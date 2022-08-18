const phoneNumberFormatter = function(phoneNumber){
    // Menghilangkan karakter kecuali angka
    let formatted = phoneNumber.replace(/\D/g, '');

    // Menghilangkan angka 0 didepan (prefix), diganti dengan 62
    if (formatted.startsWith('0')) {
        formatted = '62' + formatted.substr(1);
    }

    if (!formatted.endsWith('@c.us')) {
        formatted += '@c.us';
    }

    return formatted;
}

const groupIdFormatter = function(chatId){
    let chatIdformatted = chatId;
    
    if (!chatIdformatted.endsWith('@g.us')) {
        chatIdformatted += '@g.us';
    }

    return chatIdformatted;
}

module.exports = {
    phoneNumberFormatter,
    groupIdFormatter
}