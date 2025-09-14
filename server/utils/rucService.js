const axios = require('axios');

class RUCService {
  constructor() {
    this.apiUrl = 'https://apiperu.dev/api/ruc';
    this.token = process.env.APIPERU_TOKEN;
  }

  /**
   * Consulta datos de RUC en SUNAT a través de APIPERU
   * @param {string} ruc - RUC de 11 dígitos
   * @returns {Promise<Object>} Datos del RUC o null si no se encuentra
   */
  async consultarRUC(ruc) {
    try {
      // Validar RUC
      if (!this.validarRUC(ruc)) {
        throw new Error('RUC inválido. Debe tener 11 dígitos numéricos.');
      }

      // Verificar token
      if (!this.token) {
        console.error('❌ Token de APIPERU no configurado');
        throw new Error('Token de API no configurado');
      }

      console.log(`🔍 Consultando RUC ${ruc} en SUNAT...`);

      const response = await axios.get(`${this.apiUrl}/${ruc}?token=${this.token}`, {
        headers: {
          'Accept': 'application/json'
        },
        timeout: 15000 // 15 segundos para API externa
      });

      if (response.data && response.data.success) {
        const datos = this.procesarRespuestaSUNAT(response.data.data);
        console.log(`✅ RUC ${ruc} encontrado: ${datos.razonSocial}`);
        return datos;
      }

      console.log(`⚠️ RUC ${ruc} no encontrado en SUNAT`);
      return null;

    } catch (error) {
      console.error(`❌ Error consultando RUC ${ruc}:`, error.message);

      if (error.response) {
        // Error de respuesta de la API
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 401:
            throw new Error('Token de API inválido o expirado');
          case 403:
            throw new Error('Sin permisos para consultar la API');
          case 404:
            return null; // RUC no encontrado
          case 429:
            throw new Error('Límite de consultas excedido. Intente más tarde.');
          default:
            throw new Error(`Error de API: ${data.message || 'Error desconocido'}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout consultando RUC. Intente nuevamente.');
      }

      throw new Error('Error de conexión con el servicio de consulta RUC');
    }
  }

  /**
   * Procesa la respuesta de SUNAT y la normaliza
   * @param {Object} datosRUC - Datos crudos de SUNAT
   * @returns {Object} Datos normalizados
   */
  procesarRespuestaSUNAT(datosRUC) {
    return {
      ruc: datosRUC.ruc,
      razonSocial: (datosRUC.razon_social || '').toUpperCase(),
      nombreComercial: datosRUC.nombre_comercial ? datosRUC.nombre_comercial.toUpperCase() : null,

      // Dirección
      direccion: datosRUC.direccion || '',
      distrito: datosRUC.distrito || '',
      provincia: datosRUC.provincia || '',
      departamento: datosRUC.departamento || '',

      // Estado
      estado: this.mapearEstado(datosRUC.estado),
      condicion: this.mapearCondicion(datosRUC.condicion),

      // Fechas
      fechaInscripcion: datosRUC.fecha_inscripcion ? new Date(datosRUC.fecha_inscripcion) : null,
      fechaInicioActividades: datosRUC.fecha_inicio_actividades ? new Date(datosRUC.fecha_inicio_actividades) : null,

      // Actividad económica
      actividadEconomica: datosRUC.actividad_economica || '',

      // Sistema
      sistemaEmision: datosRUC.sistema_emision || '',
      sistemaContabilidad: datosRUC.sistema_contabilidad || '',

      // Metadatos
      ultimaConsultaRUC: new Date(),
      fuenteDatos: 'SUNAT-APIPERU'
    };
  }

  /**
   * Mapea el estado de SUNAT a nuestro enum
   * @param {string} estadoSUNAT - Estado de SUNAT
   * @returns {string} Estado normalizado
   */
  mapearEstado(estadoSUNAT) {
    const mapeoEstados = {
      'ACTIVO': 'ACTIVO',
      'INACTIVO': 'INACTIVO',
      'BAJA DE OFICIO': 'BAJA DE OFICIO',
      'BAJA PROVISIONAL': 'BAJA PROVISIONAL',
      'SUSPENSION TEMPORAL': 'SUSPENSION TEMPORAL'
    };

    return mapeoEstados[estadoSUNAT] || 'INACTIVO';
  }

  /**
   * Mapea la condición de SUNAT a nuestro enum
   * @param {string} condicionSUNAT - Condición de SUNAT
   * @returns {string} Condición normalizada
   */
  mapearCondicion(condicionSUNAT) {
    const mapeoCondiciones = {
      'HABIDO': 'HABIDO',
      'NO HABIDO': 'NO HABIDO'
    };

    return mapeoCondiciones[condicionSUNAT] || 'NO HABIDO';
  }

  /**
   * Valida formato de RUC
   * @param {string} ruc - RUC a validar
   * @returns {boolean} True si es válido
   */
  validarRUC(ruc) {
    if (!ruc || typeof ruc !== 'string') return false;

    // Limpiar RUC (solo números)
    const rucLimpio = ruc.replace(/\D/g, '');

    // Debe tener exactamente 11 dígitos
    if (rucLimpio.length !== 11) return false;

    // Validar dígito verificador
    return this.validarDigitoVerificador(rucLimpio);
  }

  /**
   * Valida el dígito verificador del RUC
   * @param {string} ruc - RUC de 11 dígitos
   * @returns {boolean} True si el dígito verificador es correcto
   */
  validarDigitoVerificador(ruc) {
    const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;

    for (let i = 0; i < 10; i++) {
      suma += parseInt(ruc[i]) * multiplicadores[i];
    }

    const resto = suma % 11;
    const digitoVerificador = resto < 2 ? resto : 11 - resto;

    return parseInt(ruc[10]) === digitoVerificador;
  }

  /**
   * Obtiene información del uso de API
   * @returns {Promise<Object>} Información de cuotas y uso
   */
  async obtenerInfoAPI() {
    try {
      if (!this.token) {
        throw new Error('Token de API no configurado');
      }

      const response = await axios.get('https://apiperu.dev/api/account', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Error obteniendo info de API:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = RUCService;