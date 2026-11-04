export function getPasswordError(password: unknown): string | null {
    if (
        typeof password !== 'string' ||
        password.length < 6 ||
        password.length > 128
    ) {
        return '密码长度需要为 6–128 个字符';
    }

    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    // 常见英文标点符号，不包含空格。
    const hasSpecial =
        /[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]/.test(password);

    const typeCount = [
        hasLetter,
        hasNumber,
        hasSpecial
    ].filter(Boolean).length;

    if (typeCount < 2) {
        return '密码需至少包含字母、数字、特殊符号中的两种';
    }

    return null;
}