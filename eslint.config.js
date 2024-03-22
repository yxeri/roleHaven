import eslint from '@eslint/js';
import tslint from 'typescript-eslint';
export default tslint.config(eslint.configs.recommended, ...tslint.configs.recommended, {
    rules: {
        '@typescript-eslint/no-unused-vars': ['error', { 'vars': 'all', 'args': 'all', 'ignoreRestSiblings': true }]
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNsaW50LmNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVzbGludC5jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxNQUFNLE1BQU0sWUFBWSxDQUFDO0FBQ2hDLE9BQU8sTUFBTSxNQUFNLG1CQUFtQixDQUFDO0FBRXZDLGVBQWUsTUFBTSxDQUFDLE1BQU0sQ0FDMUIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQzFCLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQzdCO0lBQ0UsS0FBSyxFQUFFO1FBQ0wsbUNBQW1DLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLENBQUM7S0FDN0c7Q0FDRixDQUNGLENBQUMifQ==