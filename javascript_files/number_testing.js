export function validateNumber(number) {
    const reg = /^[1-5][0-9]{9}$/;
    return reg.test(number);
};