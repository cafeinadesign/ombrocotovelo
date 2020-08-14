import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AnimationItem } from 'lottie-web';
import { AnimationOptions } from 'ngx-lottie';
import pagarme from 'pagarme/browser';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Endereco } from './endereco';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private formBuilder: FormBuilder, private http: HttpClient) {}
  agendamentoFormGroup: FormGroup;
  cardForm;
  customerForm: FormGroup;
  valorTotal = 20000;
  carregando = false;
  endereco = 'Pesquise seu endereço pelo CEP';
  address: Endereco = {
    state: '',
    city: '',
    neighborhood: '',
    street: '',
    street_number: '',
    zipcode: '',
  };
  private animationItem: AnimationItem;
  options: AnimationOptions = {
    path: 'https://assets8.lottiefiles.com/datafiles/D7hmWWCXGWSQUPi/data.json',
  };
  sucesso: AnimationOptions = {
    path:
      'https://assets10.lottiefiles.com/datafiles/jEgAWaDrrm6qdJx/data.json',
    autoplay: false,
    loop: false,
  };
  pagamentoProcessado = false;

  myFilter = (d: Date | null): boolean => {
    const today = new Date();
    const day = (d || new Date()).getDay();
    // Apenas quinta-feira
    return day === 4 && today.setHours(0, 0, 0, 0) < d.setHours(0, 0, 0, 0);
  };

  ngOnInit(): void {
    this.agendamentoFormGroup = this.formBuilder.group({
      data: ['', Validators.required],
      hora: ['', Validators.required],
    });
    this.cardForm = this.formBuilder.group({
      card_holder_name: ['', Validators.required],
      card_expiration_date: ['', Validators.required],
      card_number: ['', Validators.required],
      card_cvv: ['', Validators.required],
      installments: ['1', Validators.required],
    });
    this.customerForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', Validators.required],
      cpf: ['', Validators.required],
      birthday: [''],
      phone_number: ['', Validators.required],
      cepCtrl: ['', Validators.required],
      street_number: ['', Validators.required],
      complementary: [''],
    });
  }
  animationCreated(animationItem: AnimationItem): void {
    this.animationItem = animationItem;
    this.animationItem.play();
  }

  onSubmit(cardData): any {
    // campos obrigatórios
    if (
      !cardData.card_number &&
      !cardData.card_holder_name &&
      !cardData.card_expiration_date &&
      !cardData.card_cvv
    ) {
      return false;
    }
    // Process checkout data here
    cardData.card_number = cardData.card_number.replace(/\D/g, '');
    // pega os erros de validação nos campos do form e a bandeira do cartão
    const cardValidations = pagarme.validate({
      card: cardData,
    });
    // this.cardForm.reset();

    // console.warn('Your order has been submitted', cardValidations);
    if (!cardValidations.card.brand) {
      alert('Oops, a bandeira do cartão incorreto');
    } else if (!cardValidations.card.card_cvv) {
      alert('Oops, código de segurança do cartão incorreto');
    } else if (!cardValidations.card.card_expiration_date) {
      alert(
        'Oops, data de validade do cartão incorreto.\nPreencha no formato MM/AA'
      );
    } else if (!cardValidations.card.card_holder_name) {
      alert('Oops, nome do cartão incorreto.');
    } else if (!cardValidations.card.card_number) {
      alert('Oops, número do cartão incorreto');
    } else {
      this.carregando = true;
      // Mas caso esteja tudo certo, você pode seguir o fluxo
      pagarme.client
        .connect({ encryption_key: environment.pagarme.encryptionKey })
        .then((client) => client.security.encrypt(cardData))
        .then((CARD_HASH) => {
          console.log('birthday', this.customerForm.value.birthday);
          this.http
            .post(environment.pagarme.url + '/pagar', {
              CARD_HASH,
              installments: cardData.installments,
              card_expiration_date: cardData.card_expiration_date,
              card_holder_name: cardData.card_holder_name,
              customer: {
                // IMPLEMENTAR AUTENTICAÇÃO
                external_id: '#' + Math.floor(Date.now() / 1000),
                name: this.customerForm.value.name,
                email: this.customerForm.value.email,
                documents: [
                  { number: this.customerForm.value.cpf.replace(/\D/g, '') },
                ],
                phone_numbers: [
                  '+55' +
                    this.customerForm.value.phone_number.replace(/\D/g, ''),
                ],
                birthday: this.customerForm.value.birthday,
              },
              billing: {
                address: {
                  state: this.address.state,
                  city: this.address.city,
                  neighborhood: this.address.neighborhood,
                  street: this.address.street,
                  street_number: this.customerForm.value.street_number,
                  complementary: this.customerForm.value.complementary,
                  zipcode: this.address.zipcode,
                },
              },
            })
            .subscribe(
              (res: any) => {
                // console.error('deu erro', res);
                console.log('res.response', res.response);
                // deu erro
                if (res.name === 'ApiError') {
                  if (res.response.errors[0].message === 'Invalid CPF') {
                    alert('Ops... CPF inválido!');
                  } else if (
                    res.response.errors[0].parameter_name === 'customer'
                  ) {
                    alert(
                      'Ops... Confirme seus dados pessoais, como CPF e nome, estão corretos!\nNo telefone adicione o número e o DDD.'
                    );
                  } else if (
                    res.response.errors[0].message ===
                    '"state" is not allowed to be empty'
                  ) {
                    alert(
                      'Ops... Endereço inválido! Confime se seu CEP está correto.'
                    );
                  } else if (
                    res.response.errors[0].parameter_name === 'billing'
                  ) {
                    alert(
                      'Ops... Endereço inválido! Confime se seu CEP ou complemento estão corretos.'
                    );
                  } else {
                    alert(
                      'Ops... Ocorreu algum erro.\n' +
                        'Confirme se seus dados estão corretos e tente novamente.'
                    );
                  }
                } else {
                  console.log('agora foi ' + res.status, res);
                  switch (res.status) {
                    case 'refused':
                      alert('Pagamento foi recusado');
                      break;
                    case 'paid':
                      // alert('Pagamento realizado com sucesso xD');
                      this.pagamentoProcessado = true;
                      this.animationItem.play();
                      break;
                  }
                }
              },
              (err) => {
                this.carregando = false;
                console.error('ops... deu erro: ', err);
                alert(
                  'Ops... Ocorreu algum erro, por favor entre em contato com o adminstrador do site.'
                );
              },
              () => (this.carregando = false)
            );
        });
      // o próximo passo aqui é enviar o CARD_HASH para seu servidor, e
      // em seguida criar a transação/assinatura
    }
  }

  buscaCEP(cep: string): void {
    const zipcode = cep.replace(/-|\s/g, '');
    if (zipcode.length > 7) {
      this.endereco = 'Pesquisando...';
      this.address = {
        state: '',
        city: '',
        neighborhood: '',
        street: '',
        street_number: '',
        zipcode: '',
      };
      this.http.get('https://api.pagar.me/1/zipcodes/' + zipcode).subscribe(
        (res: Endereco) => {
          // console.log(res);
          this.address = res;
        },
        () => {
          // console.error('não encontrou o CEP');
          this.endereco = 'CEP não encontrado!';
          // console.error(error);
          this.address = {
            state: '',
            city: '',
            neighborhood: '',
            street: '',
            street_number: '',
            zipcode: '',
          };
        }
      );
    } else {
      this.endereco = 'Pesquise seu endereço pelo CEP';
      this.address = {
        state: '',
        city: '',
        neighborhood: '',
        street: '',
        street_number: '',
        zipcode: '',
      };
    }
  }
  quantidadeParcelas(installments): void {
    switch (installments) {
      case '1':
        this.valorTotal = 20000;
        break;
    }
  }
}
