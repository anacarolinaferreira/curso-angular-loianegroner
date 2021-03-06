import { distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { FormValidations } from './../shared/form-validation';
import { IEstados } from './../shared/models/estados';
import { DropdownService } from './../shared/services/dropdown.service';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, NgForm } from '@angular/forms';
import { ConsultaCepService } from '../shared/services/consulta-cep.service';
import { empty, Observable } from 'rxjs';
import { VerificaEmailService } from './services/verifica-email.service';

@Component({
  selector: 'app-data-form',
  templateUrl: './data-form.component.html',
  styleUrls: ['./data-form.component.css']
})
export class DataFormComponent implements OnInit {

  public formulario: FormGroup;

  public estados: Observable<IEstados[]>;
  public cargos: any[]
  public tecnologias: any[]
  public newsletterOp: any[]
  public frameworks = ['Angular', 'React', 'Vue', 'Elixir']

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private dropDownService: DropdownService,
    private cepService: ConsultaCepService,
    private verificaEmailService: VerificaEmailService
  ) { }

  ngOnInit() {

    // this.verificaEmailService.verificaEmail('email@email.com').subscribe();
    this.getEstados()

    this.cargos = this.dropDownService.getCargos();

    this.tecnologias = this.dropDownService.getTecnologias();

    this.newsletterOp = this.dropDownService.getNewsletter()
    // Jeito mais verboso
    // this.formulario = new FormGroup({
    //   nome: new FormControl(null),
    //   email: new FormControl(null)
    // })

    this.formulario = this.formBuilder.group({
      nome: [null, [Validators.required, Validators.minLength(3)]],
      email: [null, [Validators.required, Validators.email], this.validarEmail.bind(this)],
      confirmaremail: [null, FormValidations.equalsTo('email')],
      endereco: this.formBuilder.group({
        cep: [null, [Validators.required, FormValidations.cepValidator]],
        numero: [null, Validators.required],
        complemento: [null],
        rua: [null, Validators.required],
        bairro: [null, Validators.required],
        cidade: [null, Validators.required],
        estado: [null, Validators.required],
      }),
      cargo: [null],
      tecnologias: [null],
      newsletter: ['sim'],
      termo: [null, Validators.required],
      frameworks: this.buildFrameworks()
    })

    this.formulario.get('endereco.cep').statusChanges
      .pipe(
        distinctUntilChanged(),
        tap(value => console.log('valor CEP:', value)),
        switchMap(status => status === 'VALID' ? this.cepService.consultaCEP(this.formulario.get('endereco.cep').value) : empty())
      )
      .subscribe(dados => dados ? this.populaDadosEndereco(dados) : {})
  }
  buildFrameworks() {
    const values = this.frameworks.map(v => new FormControl(false))
    return this.formBuilder.array(values, FormValidations.requiredMinCheckBox(1))
  }

  getEstados() {
    this.estados = this.dropDownService.getEstadorBr();
  }

  onSubmit() {
    if (this.formulario.valid) {

      let valueSubmit = Object.assign({}, this.formulario.value)

      valueSubmit = Object.assign(valueSubmit, {

        frameworks: valueSubmit.frameworks
          .map((valor, indice) => valor ? this.frameworks[indice] : null)
          .filter(valor => valor !== null)
      })

      this.http.post('https://httpbin.org/post', JSON.stringify(valueSubmit))
        .subscribe((dado) => {
          console.log(`FORMULÁRIO SUBMETIDO: ${dado}`)
          // resetar o form em caso de response 200
          // this.resetar()

        },
          (error) => alert('erro'));
    } else {
      this.validateFormFields(this.formulario)
    }
  }

  public validateFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((controlForm) => {
      const control = formGroup.get(controlForm)

      control.markAsDirty();//modificado

      //verifica se o control é uma instancia de FormGroup
      if (control instanceof FormGroup) {
        this.validateFormFields(control) //onde repassará para os aninhamentos a própria função
      }

    })
  }

  resetar() {
    this.formulario.reset()
  }

  verificaValidTouched(campo: string) {
    return !this.formulario.get(campo).valid && (this.formulario.get(campo).touched || this.formulario.get(campo).dirty)
  }

  cssError(campo: string) {
    return {
      'has-error': this.verificaValidTouched(campo),
      'is-invalid': this.verificaValidTouched(campo),
    }
  }

  populaDadosEndereco(dados) {

    this.formulario.patchValue({
      endereco: {
        cep: dados.cep,
        complemento: dados.complemento,
        rua: dados.logradouro,
        bairro: dados.bairro,
        cidade: dados.localidade,
        estado: dados.uf
      }
    })

  }

  resetaDadosEndereco() {
    this.formulario.patchValue({
      endereco: {
        cep: null,
        complemento: null,
        rua: null,
        bairro: null,
        cidade: null,
        estado: null
      }
    })
  }

  consultaCEP() {
    let cep = this.formulario.get('endereco.cep').value

    if (cep != null && cep !== '') {
      this.cepService.consultaCEP(cep).subscribe(dados => this.populaDadosEndereco(dados))
    }
  }

  // SETAR CARGO
  setarCargo() {
    const cargo = { nome: 'Dev', nivel: 'Pleno', desc: 'Desenvolvedor(a) Pleno' }
    this.formulario.get('cargo').setValue(cargo)
  }

  compararCargos(obj1, obj2) {
    return obj1 && obj2 ? (obj1.nome === obj2.nome && obj1.nivel === obj2.nivel) : obj1 === obj2;
  }

  setarTecnologias() {
    this.formulario.get('tecnologias').setValue(['typescript', 'angular', 'react-native'])
  }

  validarEmail(formControl: FormControl) {
    return this.verificaEmailService.verificaEmail(formControl.value)
      .pipe(map(emailExiste => emailExiste ? { emailInvalido: true } : null))
  }

}
