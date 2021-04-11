import { FormArray, FormControl, FormGroup } from "@angular/forms";

export class FormValidations {

  static requiredMinCheckBox(min = 1) {
    const validator = (formArray: FormArray) => {
      // const values = formArray.controls;
      // let totalChecked = 0;
      // for (let i = 0; i < values.length; i++) {
      //   if (values[i].value) {
      //     totalChecked += 1;
      //   }

      // }
      const totalChecked = formArray.controls
        .map(valor => valor.value)
        .reduce((total, valorAtual) => valorAtual ? total + valorAtual : total, 0);

      return totalChecked >= min ? null : { required: true }
    };

    return validator
  }

  static cepValidator(control: FormControl) {

    let cep = control.value;
    if (cep != null) {

      //Deixando somente digitos
      cep = cep.replace(/\D/g, "");

      if (cep && cep != "") {
        const validacep = /^[0-9]{8}$/;
        return validacep.test(cep) ? null : { cepInvalido: true };
      }
    }
    return null
  }

  static equalsTo(otherField: string) {
    const validator = (formControl: FormControl) => {

      if (otherField == null) {
        throw new Error('O campo não é valido')
      }

      if (!formControl.root || !(<FormGroup>formControl.root).controls) {
        return null
      }

      const field = (<FormGroup>formControl.root).get(otherField)

      if (!field) {
        throw new Error('O campo não é valido')
      }

      if (field.value !== formControl.value) {
        return { equalsTo: otherField }
      }

      return null
    }
    return validator
  }

  static getErrorMsg(fieldName: string, validatorName: string, validatorValue?: any) {
    const config = {
      'required': `${fieldName} é obrigatório.`,
      'minlength': `${fieldName} precisa ter no mínimo ${validatorValue.requiredLength} caracteres.`,
      'maxlength': `${fieldName} precisa ter no máximo ${validatorValue.requiredLength} caracteres.`,
      'cepInvalido': 'CEP inválido'
    };

    return config[validatorName]
  }

}
