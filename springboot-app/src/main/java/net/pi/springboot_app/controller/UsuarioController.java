package net.pi.springboot_app.controller; 

import net.pi.springboot_app.model.Usuario;
import net.pi.springboot_app.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity; 
import org.springframework.web.bind.annotation.*;

import java.util.Optional; 

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "http://127.0.0.1:5500") 
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    // --- VALIDAÇÃO DE NOME ---
    private boolean validarNome(String nome) {
        if (nome == null || nome.trim().isEmpty()) {
            return false;
        }
        if (nome.matches(".*\\d.*")) {
            return false;
        }
        return true;
    }

    // --- VALIDAÇÃO DE CPF ---
    private static boolean validarCPF(String cpf) {
        cpf = cpf.replaceAll("[^0-9]", "");

        if (cpf.length() != 11) return false;
        if (cpf.matches("(\\d)\\1{10}")) return false;

        try {
            int d1 = 0;
            for (int i = 0; i < 9; i++) {
                d1 += (cpf.charAt(i) - '0') * (10 - i);
            }
            d1 = 11 - (d1 % 11);
            if (d1 > 9) d1 = 0;
            if ((cpf.charAt(9) - '0') != d1) return false;

            int d2 = 0;
            for (int i = 0; i < 10; i++) {
                d2 += (cpf.charAt(i) - '0') * (11 - i);
            }
            d2 = 11 - (d2 % 11);
            if (d2 > 9) d2 = 0;
            if ((cpf.charAt(10) - '0') != d2) return false;
            
        } catch (Exception e) {
            return false;
        }
        return true;
    }

    // --- CADASTRO SIMPLES (SEM CRIPTOGRAFIA) ---
    @PostMapping
    public ResponseEntity<Object> cadastrarUsuario(@RequestBody Usuario usuario) {
        
        if (!validarNome(usuario.getNome())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erro: Nome inválido.");
        }

        if (usuario.getCpf() == null || !validarCPF(usuario.getCpf())) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST); 
        }
        
        // Verifica apenas E-mail duplicado
        Optional<Usuario> usuarioExistente = usuarioRepository.findByEmail(usuario.getEmail());
        
        if (usuarioExistente.isPresent()) {
            return new ResponseEntity<>(HttpStatus.CONFLICT); 
        }

        // SALVA DIRETAMENTE (Senha vai como texto puro '123')
        Usuario novoUsuario = usuarioRepository.save(usuario);
        
        return new ResponseEntity<>(novoUsuario, HttpStatus.CREATED); 
    }
    
    // --- LOGIN SIMPLES (SEM CRIPTOGRAFIA) ---
    @PostMapping("/login") 
    public ResponseEntity<Usuario> loginUsuario(@RequestBody Usuario credenciais) {
        
        // Compara a senha digitada diretamente com o banco
        Optional<Usuario> usuarioEncontrado = usuarioRepository.findByEmailAndSenha(
            credenciais.getEmail(), 
            credenciais.getSenha() 
        );

        if (usuarioEncontrado.isPresent()) {
            return new ResponseEntity<>(usuarioEncontrado.get(), HttpStatus.OK); 
        } else {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
    }
}